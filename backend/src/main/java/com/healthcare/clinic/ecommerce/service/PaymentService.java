package com.healthcare.clinic.ecommerce.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.clinic.ecommerce.entity.EcPayment;
import com.healthcare.clinic.ecommerce.entity.EcommerceOrder;
import com.healthcare.clinic.ecommerce.repository.EcPaymentRepository;
import com.healthcare.clinic.ecommerce.repository.EcommerceOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;
import jakarta.annotation.PostConstruct;

@Slf4j
@Service("ecommercePaymentService")
@RequiredArgsConstructor
public class PaymentService {

    private final EcPaymentRepository paymentRepository;
    private final EcommerceOrderRepository orderRepository;
    private final ObjectMapper objectMapper;
    private final InventoryService inventoryService;

    @Value("${ecommerce.payment.provider:STRIPE}")
    private String paymentProvider;

    @Value("${stripe.secret-key:sk_test_placeholder}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret:whsec_placeholder}")
    private String endpointSecret;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        log.info("Ecommerce PaymentService initialized (Stripe SDK stubbed)");
    }

    @Transactional
    public EcPayment initiatePayment(EcommerceOrder order) {
        String idempotencyKey = "PAY_" + order.getId() + "_" + UUID.randomUUID().toString();
        
        EcPayment payment = EcPayment.builder()
                .orderId(order.getId())
                .provider(paymentProvider)
                .idempotencyKey(idempotencyKey)
                .amount(order.getTotalAmount())
                .currency("INR")
                .status("INITIATED")
                .build();

        if ("MOCK".equals(paymentProvider)) {
            payment.setProviderRef("MOCK_TXN_" + UUID.randomUUID().toString().substring(0, 8));
            log.info("Mock payment initiated for order {}, ref {}", order.getId(), payment.getProviderRef());
        } else if ("STRIPE".equalsIgnoreCase(paymentProvider)) {
            payment.setProviderRef(frontendUrl + "/checkout/mock-stripe?orderId=" + order.getId());
            payment.setPaymentMethod("STRIPE");
            log.info("[STUB] Stripe payment initiated for order {}, stub URL {}", order.getId(), payment.getProviderRef());
        } else {
            throw new UnsupportedOperationException("Provider " + paymentProvider + " not implemented");
        }

        return paymentRepository.save(payment);
    }

    @Transactional
    public void handlePaymentWebhook(String payload, String signature) {
        if ("MOCK".equals(paymentProvider)) {
            try {
                Map<String, Object> data = objectMapper.readValue(payload, Map.class);
                String providerRef = (String) data.get("providerRef");
                String status = (String) data.get("status");
                EcPayment payment = paymentRepository.findByProviderRef(providerRef)
                        .orElseThrow(() -> new IllegalArgumentException("Unknown payment reference"));
                processPaymentOutcome(payment, status, payload);
            } catch (Exception e) {
                log.error("Failed to process mock payment webhook", e);
                throw new RuntimeException("Webhook processing failed", e);
            }
        } else if ("STRIPE".equalsIgnoreCase(paymentProvider)) {
            log.info("[STUB] Stripe webhook received (Stripe SDK removed). Payload length: {}", payload != null ? payload.length() : 0);
        }
    }

    private void processPaymentOutcome(EcPayment payment, String status, String payload) {
        try {
            if ("CAPTURED".equals(payment.getStatus()) || "FAILED".equals(payment.getStatus())) {
                log.info("Payment {} already processed. Idempotent return.", payment.getId());
                return;
            }

            payment.setWebhookVerified(true);
            payment.setPgResponse(payload);

            EcommerceOrder order = orderRepository.findById(payment.getOrderId()).orElseThrow();

            if ("SUCCESS".equalsIgnoreCase(status)) {
                payment.setStatus("CAPTURED");
                payment.setCapturedAt(ZonedDateTime.now());
                order.setPaymentStatus("PAID");
                order.setStatus("CONFIRMED");
                inventoryService.convertReservationToSale(order.getPatientId(), order.getId());
            } else {
                payment.setStatus("FAILED");
                payment.setFailedAt(ZonedDateTime.now());
                order.setPaymentStatus("FAILED");
                order.setStatus("CANCELLED");
            }
            
            paymentRepository.save(payment);
            orderRepository.save(order);
        } catch (Exception e) {
            log.error("Failed to process payment outcome", e);
            throw new RuntimeException("Payment outcome processing failed", e);
        }
    }
}
