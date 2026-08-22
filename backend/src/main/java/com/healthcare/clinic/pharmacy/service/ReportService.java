package com.healthcare.clinic.pharmacy.service;


import com.healthcare.clinic.pharmacy.entity.MedicineStock;
import com.healthcare.clinic.pharmacy.model.PharmacyBill;
import com.healthcare.clinic.pharmacy.repository.*;
import com.healthcare.clinic.pharmacy.repository.*;
import com.healthcare.clinic.pharmacy.dto.common.PageResponse;
import com.healthcare.clinic.pharmacy.dto.reports.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service("pharmacyReportService")
@Transactional(readOnly = true)
public class ReportService {

    private final PharmacyBillRepository billRepository;
    private final MedicineStockRepository stockRepository;
    private final GoodsReceiptNoteRepository grnRepository;
    private final SupplierInvoiceRepository invoiceRepository;
    private final PurchaseOrderRepository poRepository;
    private final SupplierPerformanceRepository performanceRepository;
    private final PharmacyBillItemRepository billItemRepository;

    public ReportService(PharmacyBillRepository billRepository,
                         MedicineStockRepository stockRepository,
                         GoodsReceiptNoteRepository grnRepository,
                         SupplierInvoiceRepository invoiceRepository,
                         PurchaseOrderRepository poRepository,
                         SupplierPerformanceRepository performanceRepository,
                         PharmacyBillItemRepository billItemRepository) {
        this.billRepository = billRepository;
        this.stockRepository = stockRepository;
        this.grnRepository = grnRepository;
        this.invoiceRepository = invoiceRepository;
        this.poRepository = poRepository;
        this.performanceRepository = performanceRepository;
        this.billItemRepository = billItemRepository;
    }

    // ─── SALES REPORTS ─────────────────────────────────────────

    public PageResponse<SalesReportRowDTO> getSalesReport(LocalDateTime from, LocalDateTime to, Pageable pageable) {
        Page<PharmacyBill> pageResult = billRepository.findByBillingDateBetween(from, to, pageable);
        List<SalesReportRowDTO> content = pageResult.getContent().stream().map(b -> new SalesReportRowDTO(
                b.getBillNumber(),
                b.getBillingDate(),
                b.getPatientName(),
                b.getDoctorName(),
                b.getBillType(),
                b.getPaymentMode(),
                b.getSubTotal(),
                b.getDiscountAmount(),
                b.getTaxAmount(),
                b.getNetAmount(),
                b.getStatus()
        )).collect(Collectors.toList());
        return new PageResponse<>(content, pageResult.getTotalElements(), pageResult.getTotalPages(), pageResult.getNumber(), pageResult.getSize());
    }

    public DailySalesSummaryDTO getDailySalesSummary(LocalDateTime from, LocalDateTime to) {
        List<PharmacyBill> bills = billRepository.findByBillingDateBetween(from, to);
        BigDecimal totalRevenue = bills.stream().map(b -> nvl(b.getNetAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTax    = bills.stream().map(b -> nvl(b.getTaxAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDisc   = bills.stream().map(b -> nvl(b.getDiscountAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        long cashBills   = bills.stream().filter(b -> "CASH".equals(b.getBillType()) || "OTC".equals(b.getBillType())).count();
        long creditBills = bills.stream().filter(b -> "CREDIT".equals(b.getBillType())).count();

        return new DailySalesSummaryDTO(
                totalRevenue,
                totalTax,
                totalDisc,
                totalRevenue.subtract(totalTax),
                bills.size(),
                cashBills,
                creditBills,
                from.toLocalDate() + " to " + to.toLocalDate()
        );
    }

    public List<MedicineWiseSaleDTO> getMedicineWiseSales(LocalDateTime from, LocalDateTime to) {
        return billItemRepository.getMedicineWiseSales(from, to).stream()
                .map(summary -> new MedicineWiseSaleDTO(
                        summary.getMedicine(),
                        summary.getUnitsSold(),
                        summary.getRevenue(),
                        summary.getTax()
                )).collect(Collectors.toList());
    }

    public List<ItemisedSaleDTO> getItemisedSalesRegister(LocalDateTime from, LocalDateTime to) {
        List<PharmacyBill> bills = billRepository.findByBillingDateBetweenWithItems(from, to);
        List<ItemisedSaleDTO> rows = new ArrayList<>();
        bills.forEach(b -> b.getItems().forEach(item -> {
            String med = item.getStock() != null && item.getStock().getMedicine() != null
                    ? item.getStock().getMedicine().getName() : "—";
            String hsn = item.getStock() != null && item.getStock().getMedicine() != null
                    ? item.getStock().getMedicine().getHsnCode() : "—";
            
            rows.add(new ItemisedSaleDTO(
                    b.getBillNumber(),
                    b.getBillingDate(),
                    b.getPatientName(),
                    b.getDoctorName(),
                    med,
                    hsn,
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getDiscountAmount(),
                    item.getTaxAmount(),
                    item.getNetAmount()
            ));
        }));
        return rows;
    }

    public List<CreditSaleDTO> getCreditSalesReport(LocalDateTime from, LocalDateTime to) {
        List<PharmacyBill> bills = billRepository.findByBillingDateBetween(from, to)
                .stream().filter(b -> "CREDIT".equals(b.getBillType())).collect(Collectors.toList());
        return bills.stream().map(b -> new CreditSaleDTO(
                b.getBillNumber(),
                b.getBillingDate(),
                b.getPatientName(),
                b.getNetAmount(),
                b.getPaidAmount(),
                b.getBalanceAmount(),
                b.getStatus()
        )).collect(Collectors.toList());
    }

    public List<CancelledBillDTO> getCancelledBillsReport(LocalDateTime from, LocalDateTime to) {
        return billRepository.findByBillingDateBetween(from, to).stream()
                .filter(b -> "CANCELLED".equals(b.getStatus()))
                .map(b -> new CancelledBillDTO(
                        b.getBillNumber(),
                        b.getBillingDate(),
                        b.getPatientName(),
                        b.getNetAmount(),
                        b.getCreatedBy()
                )).collect(Collectors.toList());
    }

    // ─── GST REPORTS ─────────────────────────────────────────────

    public TaxReportDTO getTaxReport(LocalDateTime from, LocalDateTime to) {
        List<PharmacyBill> bills = billRepository.findByBillingDateBetween(from, to);
        BigDecimal totalTax    = bills.stream().map(b -> nvl(b.getTaxAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAmount = bills.stream().map(b -> nvl(b.getNetAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cgst = totalTax.divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal sgst = totalTax.subtract(cgst);

        return new TaxReportDTO(
                totalTax,
                cgst,
                sgst,
                BigDecimal.ZERO,
                totalAmount,
                totalAmount.subtract(totalTax),
                bills.size(),
                from.toLocalDate() + " to " + to.toLocalDate()
        );
    }

    public List<GstSaleRegisterDTO> getGstSalesRegister(LocalDateTime from, LocalDateTime to) {
        return getItemisedSalesRegister(from, to).stream().map(row -> {
            BigDecimal net = nvl(row.netAmount());
            BigDecimal tax = nvl(row.tax());
            BigDecimal taxable = net.subtract(tax);
            BigDecimal cgst = tax.divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP);
            
            return new GstSaleRegisterDTO(
                    row.billNumber(),
                    row.date(),
                    row.patient(),
                    row.doctor(),
                    row.medicine(),
                    row.hsnCode(),
                    row.quantity(),
                    row.unitPrice(),
                    row.discount(),
                    row.tax(),
                    row.netAmount(),
                    taxable,
                    cgst,
                    tax.subtract(cgst),
                    BigDecimal.ZERO,
                    tax
            );
        }).collect(Collectors.toList());
    }

    // ─── STOCK REPORTS ─────────────────────────────────────────────

    public PageResponse<StockReportDTO> getStockReport(String search, Pageable pageable) {
        Page<MedicineStock> pageResult;
        if (search != null && !search.trim().isEmpty()) {
            pageResult = stockRepository.findByMedicineNameContainingIgnoreCase(search.trim(), pageable);
        } else {
            pageResult = stockRepository.findAll(pageable);
        }
        
        List<StockReportDTO> content = pageResult.getContent().stream().map(s -> new StockReportDTO(
                s.getMedicine() != null ? s.getMedicine().getName() : "Unknown",
                s.getMedicine() != null ? s.getMedicine().getCategory() : "—",
                s.getMedicine() != null ? s.getMedicine().getHsnCode() : "—",
                s.getBatchNumber(),
                s.getQuantityAvailable(),
                s.getPurchaseRate(),
                s.getSellingRate(),
                s.getExpiryDate(),
                s.getSupplier() != null ? s.getSupplier().getName() : "—",
                s.getPurchaseRate() != null ? s.getPurchaseRate().multiply(BigDecimal.valueOf(nvlInt(s.getQuantityAvailable()))) : BigDecimal.ZERO
        )).collect(Collectors.toList());
        return new PageResponse<>(content, pageResult.getTotalElements(), pageResult.getTotalPages(), pageResult.getNumber(), pageResult.getSize());
    }

    public List<ExpiryReportDTO> getExpiryReport(int days) {
        LocalDate threshold = LocalDate.now().plusDays(days);
        LocalDate today = LocalDate.now();
        return stockRepository.findByExpiryDateBefore(threshold).stream()
                .filter(s -> s.getQuantityAvailable() != null && s.getQuantityAvailable() > 0)
                .map(s -> {
                    int daysLeft = s.getExpiryDate() != null ? (int) (s.getExpiryDate().toEpochDay() - today.toEpochDay()) : 0;
                    String urgency = daysLeft <= 0 ? "EXPIRED" : daysLeft <= 15 ? "CRITICAL" : daysLeft <= 30 ? "WARNING" : "EARLY_ALERT";
                    
                    return new ExpiryReportDTO(
                            s.getMedicine() != null ? s.getMedicine().getName() : "Unknown",
                            s.getBatchNumber(),
                            s.getExpiryDate(),
                            s.getQuantityAvailable(),
                            s.getSupplier() != null ? s.getSupplier().getName() : "—",
                            daysLeft,
                            urgency
                    );
                }).collect(Collectors.toList());
    }

    public List<SlowMovingStockDTO> getSlowMovingStockReport(LocalDateTime from, LocalDateTime to, int threshold) {
        List<MedicineWiseSaleDTO> salesData = getMedicineWiseSales(from, to);
        Set<String> movingMeds = salesData.stream()
                .filter(r -> r.unitsSold() != null && r.unitsSold() >= threshold)
                .map(MedicineWiseSaleDTO::medicine)
                .collect(Collectors.toSet());

        return stockRepository.findAll().stream()
                .filter(s -> s.getQuantityAvailable() != null && s.getQuantityAvailable() > 0)
                .map(s -> s.getMedicine() != null ? s.getMedicine().getName() : "Unknown")
                .filter(name -> !movingMeds.contains(name))
                .distinct()
                .map(name -> {
                    int sold = salesData.stream()
                            .filter(r -> name.equals(r.medicine()))
                            .mapToInt(r -> r.unitsSold() != null ? r.unitsSold() : 0).sum();
                    return new SlowMovingStockDTO(name, sold);
                }).collect(Collectors.toList());
    }

    // ─── PURCHASE REPORTS ─────────────────────────────────────────

    public List<PurchaseRegisterDTO> getPurchaseRegister(LocalDateTime from, LocalDateTime to) {
        return grnRepository.findAll().stream()
                .filter(g -> g.getReceivedDate() != null && !g.getReceivedDate().isBefore(from) && !g.getReceivedDate().isAfter(to))
                .map(g -> new PurchaseRegisterDTO(
                        g.getGrnNumber(),
                        g.getReceivedDate() != null ? g.getReceivedDate().toLocalDate() : null,
                        g.getSupplier() != null ? g.getSupplier().getName() : "—",
                        g.getSupplierInvoiceNumber(),
                        g.getStatus(),
                        g.getItems() != null ? g.getItems().size() : 0
                )).collect(Collectors.toList());
    }

    public List<OutstandingPayableDTO> getOutstandingPayables() {
        LocalDate today = LocalDate.now();
        return invoiceRepository.findAll().stream()
                .filter(inv -> !"PAID".equals(inv.getStatus()))
                .map(inv -> {
                    int daysOld = inv.getInvoiceDate() != null ? (int) (today.toEpochDay() - inv.getInvoiceDate().toEpochDay()) : 0;
                    String agingBucket = daysOld <= 30 ? "0-30 days" : daysOld <= 60 ? "31-60 days" : "61+ days";
                    
                    return new OutstandingPayableDTO(
                            inv.getInvoiceNumber(),
                            inv.getSupplier() != null ? inv.getSupplier().getName() : "—",
                            inv.getTotalAmount(),
                            inv.getStatus(),
                            daysOld,
                            agingBucket
                    );
                }).collect(Collectors.toList());
    }

    public List<SupplierPerformanceDTO> getSupplierPerformanceSummary() {
        return performanceRepository.findAll().stream().map(p -> new SupplierPerformanceDTO(
                p.getSupplier() != null ? p.getSupplier().getName() : "—",
                p.getOverallScore(),
                p.getOnTimeDeliveryRate(),
                p.getOrderFillRate(),
                p.getQualityRejectionRate(),
                p.getInvoiceAccuracyRate(),
                p.getPeriodStart(),
                p.getPeriodEnd()
        )).sorted((a, b) -> {
            double scoreA = a.overallScore() != null ? a.overallScore() : 0;
            double scoreB = b.overallScore() != null ? b.overallScore() : 0;
            return Double.compare(scoreB, scoreA);
        }).collect(Collectors.toList());
    }

    // ─── Helpers ───────────────────────────────────────────────
    private BigDecimal nvl(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }
    private int nvlInt(Integer v) { return v != null ? v : 0; }
}
