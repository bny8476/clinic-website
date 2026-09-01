package com.healthcare.clinic.billing.service;

import com.healthcare.clinic.billing.dto.*;
import com.healthcare.clinic.billing.entity.*;
import com.healthcare.clinic.billing.repository.InvoiceItemRepository;
import com.healthcare.clinic.billing.repository.InvoiceRepository;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.exception.ResourceNotFoundException;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.notification.event.InvoiceCreatedEvent;
import com.healthcare.clinic.security.SecurityUtils;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.TransactionDefinition;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PlatformTransactionManager transactionManager;

    // ─── Queries ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesForPatient(Long patientId) {
        return invoiceRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(Long id) {
        return mapToResponse(invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesByStatus(String status) {
        InvoiceStatus invoiceStatus = InvoiceStatus.valueOf(status.toUpperCase());
        return invoiceRepository.findByStatus(invoiceStatus).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    // ─── Mutations ────────────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        if (!userRepository.existsById(request.getPatientId())) {
            throw new ResourceNotFoundException("Patient not found: " + request.getPatientId());
        }

        final Branch finalBranch;
        if (request.getBranchId() != null) {
            finalBranch = branchRepository.findById(request.getBranchId()).orElse(null);
        } else {
            finalBranch = null;
        }

        // Build items and compute subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        List<InvoiceItem> items = new java.util.ArrayList<>();
        for (InvoiceItemRequest ir : request.getItems()) {
            BigDecimal lineTotal = ir.getUnitPrice().multiply(BigDecimal.valueOf(ir.getQuantity()));
            subtotal = subtotal.add(lineTotal);
            items.add(InvoiceItem.builder()
                    .description(ir.getDescription())
                    .quantity(ir.getQuantity())
                    .unitPrice(ir.getUnitPrice())
                    .totalPrice(lineTotal)
                    .itemType(ir.getItemType() != null ? ir.getItemType() : ItemType.OTHER)
                    .referenceId(ir.getReferenceId())
                    .build());
        }

        BigDecimal tax = request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO;
        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal total = subtotal.add(tax).subtract(discount);

        // Use provided amount if no items given (backward compat)
        if (items.isEmpty()) {
            total = request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO;
            subtotal = total;
        }

        // Generate human-readable invoice number and save with retry
        int year = LocalDateTime.now().getYear();
        Invoice saved = null;
        String invoiceNumber = null;
        int attempts = 0;
        
        while (attempts < 5) {
            try {
                invoiceNumber = nextInvoiceNumber(year);
                
                Invoice invoice = Invoice.builder()
                        .invoiceNumber(invoiceNumber)
                        .patientId(request.getPatientId())
                        .appointmentId(request.getAppointmentId())
                        .branch(finalBranch)
                        .amount(subtotal)
                        .taxAmount(tax)
                        .discountAmount(discount)
                        .totalAmount(total)
                        .status(InvoiceStatus.ISSUED)
                        .description(request.getDescription())
                        .dueDate(request.getDueDate())
                        .build();

                TransactionTemplate tt = new TransactionTemplate(transactionManager);
                tt.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
                saved = tt.execute(status -> invoiceRepository.save(invoice));
                break;
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                attempts++;
                if (attempts >= 5) {
                    throw new RuntimeException("Could not generate a unique invoice number after 5 attempts", e);
                }
            }
        }

        // Link items and save
        for (InvoiceItem item : items) {
            item.setInvoice(saved);
        }
        invoiceItemRepository.saveAll(items);
        saved.setItems(items);

        // Publish event for notifications
        String patientEmail = userRepository.findById(request.getPatientId())
                .map(u -> u.getEmail()).orElse(null);
        String patientName = userRepository.findById(request.getPatientId())
                .map(u -> u.getFirstName() + " " + u.getLastName()).orElse("Patient");
        eventPublisher.publishEvent(InvoiceCreatedEvent.builder()
                .invoiceId(saved.getId())
                .patientId(request.getPatientId())
                .patientEmail(patientEmail)
                .patientName(patientName)
                .invoiceNumber(invoiceNumber)
                .totalAmount(total)
                .dueDate(request.getDueDate())
                .build());

        return mapToResponse(saved);
    }

    @Transactional
    public InvoiceResponse addItem(Long invoiceId, InvoiceItemRequest request) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceId));

        BigDecimal lineTotal = request.getUnitPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        InvoiceItem item = InvoiceItem.builder()
                .invoice(invoice)
                .description(request.getDescription())
                .quantity(request.getQuantity())
                .unitPrice(request.getUnitPrice())
                .totalPrice(lineTotal)
                .itemType(request.getItemType() != null ? request.getItemType() : ItemType.OTHER)
                .referenceId(request.getReferenceId())
                .build();
        invoiceItemRepository.save(item);

        // Recompute totals
        List<InvoiceItem> allItems = invoiceItemRepository.findByInvoiceId(invoiceId);
        BigDecimal subtotal = allItems.stream()
                .map(InvoiceItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        invoice.setAmount(subtotal);
        invoice.setTotalAmount(subtotal.add(invoice.getTaxAmount()).subtract(invoice.getDiscountAmount()));
        invoiceRepository.save(invoice);

        return mapToResponse(invoice);
    }

    @Transactional
    public InvoiceResponse markPaid(Long id, String paymentMethod) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new IllegalStateException("Invoice is already paid");
        }

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaymentMethod(paymentMethod);
        invoice.setPaidAt(LocalDateTime.now());
        return mapToResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse payInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!invoice.getPatientId().equals(currentUserId)) {
            throw new AccessDeniedException("Not authorized to pay this invoice");
        }

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new IllegalStateException("Invoice is already paid");
        }

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        invoice.setPaymentMethod("ONLINE");
        return mapToResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse cancelInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new IllegalStateException("Invoice is already cancelled");
        }
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new IllegalStateException("Cannot cancel a paid invoice. Issue a refund instead.");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        return mapToResponse(invoiceRepository.save(invoice));
    }

    // ─── PDF Generation ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generatePdf(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceId));

        String patientName = userRepository.findById(invoice.getPatientId())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown Patient");

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 40, 40, 60, 40);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            // ── Header ──────────────────────────────────────────────────────
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.decode("#1e3a5f"));
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.DARK_GRAY);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font smallGray  = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);

            Paragraph clinic = new Paragraph("HealthCare Clinic", titleFont);
            clinic.setAlignment(Element.ALIGN_CENTER);
            doc.add(clinic);

            Paragraph subtitle = new Paragraph("Tax Invoice / Receipt", 
                    FontFactory.getFont(FontFactory.HELVETICA, 12, Color.GRAY));
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            doc.add(subtitle);

            // ── Invoice Meta ─────────────────────────────────────────────────
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingAfter(16);
            addMetaRow(metaTable, "Invoice No.:", invoice.getInvoiceNumber(), labelFont, valueFont);
            addMetaRow(metaTable, "Patient:", patientName, labelFont, valueFont);
            addMetaRow(metaTable, "Status:", invoice.getStatus().name(), labelFont, valueFont);
            addMetaRow(metaTable, "Due Date:",
                    invoice.getDueDate() != null
                            ? invoice.getDueDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy"))
                            : "N/A",
                    labelFont, valueFont);
            if (invoice.getPaidAt() != null) {
                addMetaRow(metaTable, "Paid At:",
                        invoice.getPaidAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm")),
                        labelFont, valueFont);
                addMetaRow(metaTable, "Payment Method:",
                        invoice.getPaymentMethod() != null ? invoice.getPaymentMethod() : "N/A",
                        labelFont, valueFont);
            }
            doc.add(metaTable);

            // ── Line Items Table ─────────────────────────────────────────────
            PdfPTable itemsTable = new PdfPTable(new float[]{5, 1, 2, 2});
            itemsTable.setWidthPercentage(100);
            itemsTable.setSpacingAfter(12);

            Font thFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Color thBg = Color.decode("#1e3a5f");
            for (String header : new String[]{"Description", "Qty", "Unit Price", "Total"}) {
                PdfPCell cell = new PdfPCell(new Phrase(header, thFont));
                cell.setBackgroundColor(thBg);
                cell.setPadding(8);
                cell.setBorderColor(thBg);
                itemsTable.addCell(cell);
            }

            List<InvoiceItem> items = invoiceItemRepository.findByInvoiceId(invoiceId);
            boolean alt = false;
            for (InvoiceItem item : items) {
                Color rowBg = alt ? Color.decode("#f8fafc") : Color.WHITE;
                addItemRow(itemsTable, item.getDescription(), rowBg, valueFont);
                addItemRow(itemsTable, String.valueOf(item.getQuantity()), rowBg, valueFont);
                addItemRow(itemsTable, "₹" + item.getUnitPrice(), rowBg, valueFont);
                addItemRow(itemsTable, "₹" + item.getTotalPrice(), rowBg, valueFont);
                alt = !alt;
            }

            if (items.isEmpty()) {
                PdfPCell emptyCell = new PdfPCell(new Phrase(invoice.getDescription(), valueFont));
                emptyCell.setColspan(4);
                emptyCell.setPadding(8);
                itemsTable.addCell(emptyCell);
                addItemRow(itemsTable, "1", Color.WHITE, valueFont);
                addItemRow(itemsTable, "₹" + invoice.getAmount(), Color.WHITE, valueFont);
                addItemRow(itemsTable, "₹" + invoice.getAmount(), Color.WHITE, valueFont);
            }

            doc.add(itemsTable);

            // ── Totals ───────────────────────────────────────────────────────
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(45);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            addTotalRow(totalsTable, "Subtotal:", "₹" + invoice.getAmount(), labelFont, valueFont);
            addTotalRow(totalsTable, "Tax:", "₹" + invoice.getTaxAmount(), labelFont, valueFont);
            addTotalRow(totalsTable, "Discount:", "₹" + invoice.getDiscountAmount(), labelFont, valueFont);

            Font totalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.decode("#1e3a5f"));
            addTotalRow(totalsTable, "TOTAL DUE:", "₹" + invoice.getTotalAmount(), totalFont, totalFont);
            doc.add(totalsTable);

            // ── Footer ───────────────────────────────────────────────────────
            Paragraph footer = new Paragraph(
                    "\nThank you for choosing HealthCare Clinic. This is a computer-generated invoice.",
                    smallGray);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(30);
            doc.add(footer);

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }

    // ─── PDF helpers ──────────────────────────────────────────────────────────

    private String nextInvoiceNumber(int year) {
        String prefix = "INV-" + year + "-";
        java.util.Optional<Invoice> maxInvoiceOpt = invoiceRepository.findFirstByInvoiceNumberStartingWithOrderByInvoiceNumberDesc(prefix);
        long nextSequence = 1;
        if (maxInvoiceOpt.isPresent()) {
            String maxInvoice = maxInvoiceOpt.get().getInvoiceNumber();
            if (maxInvoice != null && maxInvoice.length() > 9) {
                try {
                    nextSequence = Long.parseLong(maxInvoice.substring(maxInvoice.lastIndexOf('-') + 1)) + 1;
                } catch (NumberFormatException ignored) {}
            }
        }
        return String.format("INV-%s-%05d", year, nextSequence);
    }

    private void addMetaRow(PdfPTable t, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell l = new PdfPCell(new Phrase(label, labelFont));
        l.setBorder(0); l.setPaddingBottom(4);
        PdfPCell v = new PdfPCell(new Phrase(value, valueFont));
        v.setBorder(0); v.setPaddingBottom(4);
        t.addCell(l); t.addCell(v);
    }

    private void addItemRow(PdfPTable t, String text, Color bg, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(7);
        t.addCell(cell);
    }

    private void addTotalRow(PdfPTable t, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell l = new PdfPCell(new Phrase(label, labelFont));
        l.setBorder(0); l.setPaddingBottom(4);
        PdfPCell v = new PdfPCell(new Phrase(value, valueFont));
        v.setBorder(0); v.setPaddingBottom(4); v.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(l); t.addCell(v);
    }

    // ─── Mapping ──────────────────────────────────────────────────────────────

    private InvoiceResponse mapToResponse(Invoice invoice) {
        String patientName = userRepository.findById(invoice.getPatientId())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown Patient");

        List<InvoiceItemResponse> itemResponses = invoice.getItems() == null ? List.of() :
                invoice.getItems().stream().map(i -> InvoiceItemResponse.builder()
                        .id(i.getId())
                        .description(i.getDescription())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .totalPrice(i.getTotalPrice())
                        .itemType(i.getItemType())
                        .referenceId(i.getReferenceId())
                        .build()).collect(Collectors.toList());

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .patientId(invoice.getPatientId())
                .patientName(patientName)
                .appointmentId(invoice.getAppointmentId())
                .amount(invoice.getAmount())
                .taxAmount(invoice.getTaxAmount())
                .discountAmount(invoice.getDiscountAmount())
                .totalAmount(invoice.getTotalAmount())
                .status(invoice.getStatus())
                .description(invoice.getDescription())
                .dueDate(invoice.getDueDate())
                .paymentMethod(invoice.getPaymentMethod())
                .paidAt(invoice.getPaidAt())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .items(itemResponses)
                .build();
    }
}
