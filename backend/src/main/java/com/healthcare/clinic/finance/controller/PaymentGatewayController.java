package com.healthcare.clinic.finance.controller;

import com.healthcare.clinic.finance.service.StripePaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/finance/payments")
@PreAuthorize("hasAuthority('ROLE_FINANCE') or hasAuthority('ROLE_ACCOUNTANT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class PaymentGatewayController {

    private final StripePaymentService stripePaymentService;

    @PostMapping("/checkout/{invoiceId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<Map<String, String>> createCheckoutSession(
            @PathVariable Long invoiceId) {
        
        String checkoutUrl = stripePaymentService.createCheckoutSession(invoiceId);
        
        Map<String, String> response = new HashMap<>();
        response.put("checkoutUrl", checkoutUrl);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook/stripe")
    public ResponseEntity<Void> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        
        stripePaymentService.processWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }
}
