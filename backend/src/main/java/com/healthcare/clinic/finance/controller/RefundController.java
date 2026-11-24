package com.healthcare.clinic.finance.controller;

import com.healthcare.clinic.finance.entity.Refund;
import com.healthcare.clinic.finance.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/v1/finance/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPER_ADMIN')")
    public ResponseEntity<List<Refund>> getRefunds() {
        return ResponseEntity.ok(refundService.getAllRefunds());
    }

    @PostMapping("/initiate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPER_ADMIN')")
    public ResponseEntity<Refund> initiateRefund(@RequestBody Map<String, Object> request) {
        Long paymentId = Long.valueOf(request.get("paymentId").toString());
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        String reason = (String) request.get("reason");
        Long requestedBy = Long.valueOf(request.get("requestedBy").toString());
        String idempotencyKey = (String) request.get("idempotencyKey");

        Refund refund = refundService.initiateRefund(paymentId, amount, reason, requestedBy, idempotencyKey);
        return ResponseEntity.ok(refund);
    }

    @PostMapping("/{refundId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPER_ADMIN')")
    public ResponseEntity<Refund> approveRefund(
            @PathVariable Long refundId,
            @RequestBody Map<String, Object> request) {
        
        Long approvedBy = Long.valueOf(request.get("approvedBy").toString());
        Refund refund = refundService.approveRefund(refundId, approvedBy);
        return ResponseEntity.ok(refund);
    }

    @PostMapping("/{refundId}/process")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPER_ADMIN')")
    public ResponseEntity<Refund> processRefund(@PathVariable Long refundId) {
        Refund refund = refundService.processRefund(refundId);
        return ResponseEntity.ok(refund);
    }
}
