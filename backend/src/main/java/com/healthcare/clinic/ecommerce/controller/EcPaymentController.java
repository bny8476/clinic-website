package com.healthcare.clinic.ecommerce.controller;

import com.healthcare.clinic.ecommerce.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ecommerce/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class EcPaymentController {

    private final PaymentService paymentService;
    private final com.healthcare.clinic.ecommerce.repository.EcPaymentRepository paymentRepository;
    private final Environment environment;

    @Value("${ecommerce.payment.allow-mock:false}")
    private boolean allowMock;

    @Value("${ecommerce.payment.mode:DEVELOPMENT}")
    private String paymentMode;

    private boolean isProductionEnvironment() {
        if ("PRODUCTION".equalsIgnoreCase(paymentMode)) {
            return true;
        }
        if (environment != null && environment.getActiveProfiles() != null) {
            return Arrays.stream(environment.getActiveProfiles())
                    .anyMatch(p -> "prod".equalsIgnoreCase(p) || "production".equalsIgnoreCase(p));
        }
        return false;
    }

    @PostMapping("/mock")
    public ResponseEntity<Void> simulateMockPayment(@RequestBody Map<String, Object> request) {
        if (isProductionEnvironment() || !allowMock) {
            log.error("Attempted to call mock payment endpoint in production environment or when allow-mock is false");
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mock payment endpoint is disabled in production environment");
        }

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
