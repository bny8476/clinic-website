package com.healthcare.clinic.finance.controller;

import com.healthcare.clinic.finance.entity.Payment;
import com.healthcare.clinic.finance.entity.PaymentAllocation;
import com.healthcare.clinic.finance.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/finance/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPER_ADMIN', 'RECEPTION', 'RECEPTIONIST')")
    public ResponseEntity<Payment> initiatePayment(@RequestBody Map<String, Object> request) {
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        String paymentMethod = (String) request.get("paymentMethod");
        String idempotencyKey = (String) request.get("idempotencyKey");

        Payment payment = paymentService.initiatePayment(amount, paymentMethod, idempotencyKey);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{paymentId}/capture")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPER_ADMIN', 'RECEPTION', 'RECEPTIONIST')")
    public ResponseEntity<Payment> capturePayment(
            @PathVariable Long paymentId,
            @RequestBody Map<String, String> request) {
        
        String transactionRef = request.get("transactionRef");
        Payment payment = paymentService.capturePayment(paymentId, transactionRef);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{paymentId}/allocate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPER_ADMIN', 'RECEPTION', 'RECEPTIONIST')")
    public ResponseEntity<PaymentAllocation> allocatePayment(
            @PathVariable Long paymentId,
            @RequestBody Map<String, Object> request) {
        
        Long invoiceId = Long.valueOf(request.get("invoiceId").toString());
        BigDecimal allocationAmount = new BigDecimal(request.get("amount").toString());
        
        PaymentAllocation allocation = paymentService.allocatePaymentToInvoice(paymentId, invoiceId, allocationAmount);
        return ResponseEntity.ok(allocation);
    }
}
