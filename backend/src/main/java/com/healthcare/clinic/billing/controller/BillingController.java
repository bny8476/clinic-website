package com.healthcare.clinic.billing.controller;

import com.healthcare.clinic.audit.annotation.AuditableAction;
import com.healthcare.clinic.billing.dto.*;
import com.healthcare.clinic.billing.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    // ─── Patient endpoints ────────────────────────────────────────────────────

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("(hasAuthority('ROLE_PATIENT') and @securityUtils.isSameUser(#patientId)) " +
                  "or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_ACCOUNTANT') or hasAuthority('ROLE_RECEPTION')")
    @AuditableAction(module = "BILLING", action = "VIEW", resourceType = "Invoice", sensitivityLevel = "NORMAL")
    public ResponseEntity<List<InvoiceResponse>> getPatientInvoices(@PathVariable Long patientId) {
        return ResponseEntity.ok(billingService.getInvoicesForPatient(patientId));
    }

    @PutMapping("/{id}/pay")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    @AuditableAction(module = "BILLING", action = "PAYMENT", resourceType = "Invoice", sensitivityLevel = "HIGH")
    public ResponseEntity<InvoiceResponse> payInvoice(@PathVariable Long id) {
        InvoiceResponse response = billingService.getInvoice(id);
        assertCanAccessInvoice(response.getPatientId());
        return ResponseEntity.ok(billingService.payInvoice(id));
    }

    // ─── Admin / Accountant endpoints ─────────────────────────────────────────

    @GetMapping("/invoices")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_ACCOUNTANT') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices() {
        return ResponseEntity.ok(billingService.getAllInvoices());
    }

    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_ACCOUNTANT') or hasAuthority('ROLE_SUPER_ADMIN') " +
                  "or hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<InvoiceResponse> getInvoice(@PathVariable Long id) {
        InvoiceResponse response = billingService.getInvoice(id);
        assertCanAccessInvoice(response.getPatientId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invoices/status/{status}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_ACCOUNTANT') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(billingService.getInvoicesByStatus(status));
    }

    @PostMapping("/invoices")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_BRANCH_ADMIN') or hasAuthority('ROLE_ACCOUNTANT') or hasAuthority('ROLE_RECEPTION')")
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody InvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billingService.createInvoice(request));
    }

    @PostMapping("/invoices/{id}/items")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_ACCOUNTANT') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<InvoiceResponse> addItem(@PathVariable Long id,
                                                    @Valid @RequestBody InvoiceItemRequest request) {
        return ResponseEntity.ok(billingService.addItem(id, request));
    }

    @PatchMapping("/invoices/{id}/mark-paid")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_ACCOUNTANT') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_RECEPTION')")
    @AuditableAction(module = "BILLING", action = "MARK_PAID", resourceType = "Invoice", sensitivityLevel = "HIGH")
    public ResponseEntity<InvoiceResponse> markPaid(@PathVariable Long id,
                                                     @RequestParam String paymentMethod) {
        return ResponseEntity.ok(billingService.markPaid(id, paymentMethod));
    }

    // ─── PDF ──────────────────────────────────────────────────────────────────

    @GetMapping("/invoices/{id}/pdf")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_ACCOUNTANT') " +
                  "or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_RECEPTION')")
    @AuditableAction(module = "BILLING", action = "DOWNLOAD_PDF", resourceType = "Invoice", sensitivityLevel = "HIGH")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        InvoiceResponse response = billingService.getInvoice(id);
        assertCanAccessInvoice(response.getPatientId());
        
        byte[] pdf = billingService.generatePdf(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "invoice-" + id + ".pdf");
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    private void assertCanAccessInvoice(Long patientId) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean hasPrivilegedRole = auth.getAuthorities().stream().anyMatch(a -> 
            a.getAuthority().equals("ROLE_ADMIN") || 
            a.getAuthority().equals("ROLE_ACCOUNTANT") ||
            a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
            a.getAuthority().equals("ROLE_RECEPTION")
        );
        if (hasPrivilegedRole) {
            return;
        }
        Long currentUserId = com.healthcare.clinic.security.SecurityUtils.getCurrentUserId();
        if (currentUserId == null || !currentUserId.equals(patientId)) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to access this invoice");
        }
    }
}
