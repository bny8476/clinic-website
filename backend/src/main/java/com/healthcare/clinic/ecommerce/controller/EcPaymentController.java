package com.healthcare.clinic.ecommerce.controller;

import com.healthcare.clinic.ecommerce.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/ecommerce/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class EcPaymentController {

    private final PaymentService paymentService;
    private final com.healthcare.clinic.ecommerce.repository.EcPaymentRepository paymentRepository;

    @PostMapping("/mock")
    public ResponseEntity<Void> simulateMockPayment(@RequestBody Map<String, Object> request) {
        String status = (String) request.get("status");
        Long orderId = Long.valueOf(request.get("orderId").toString());
        
        com.healthcare.clinic.ecommerce.entity.EcPayment payment = paymentRepository.findFirstByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for order"));
                
        String providerRef = payment.getProviderRef();
        
        // This simulates a webhook payload from the mock payment gateway
        String payload = String.format("{\"providerRef\":\"%s\",\"status\":\"%s\"}", providerRef, status);
        
        paymentService.handlePaymentWebhook(payload, "MOCK_SIG");
        return ResponseEntity.ok().build();
    }
}
