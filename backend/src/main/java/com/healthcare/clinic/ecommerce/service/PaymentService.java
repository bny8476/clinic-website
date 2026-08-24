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

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;

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

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret}")
    private String endpointSecret;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
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
            long amountInCents = order.getTotalAmount().multiply(new BigDecimal("100")).longValue();

            try {
                SessionCreateParams params = SessionCreateParams.builder()
                        .setMode(SessionCreateParams.Mode.PAYMENT)
                        .setSuccessUrl(frontendUrl + "/success?session_id={CHECKOUT_SESSION_ID}")
                        .setCancelUrl(frontendUrl + "/cancel")
                        .setClientReferenceId("ECOMM_" + order.getId().toString())
                        .addLineItem(
                                SessionCreateParams.LineItem.builder()
                                        .setQuantity(1L)
                                        .setPriceData(
                                                SessionCreateParams.LineItem.PriceData.builder()
                                                        .setCurrency("inr")
                                                        .setUnitAmount(amountInCents)
                                                        .setProductData(
                                                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                        .setName("Ecommerce Order #" + order.getId())
                                                                        .build()
                                                        )
                                                        .build()
                                        )
                                        .build()
                        )
                        .build();

                Session session = Session.create(params);
                payment.setProviderRef(session.getUrl()); // Storing URL in providerRef to redirect client
                payment.setPaymentMethod("STRIPE");
                log.info("Stripe payment initiated for order {}, url {}", order.getId(), session.getUrl());
            } catch (StripeException e) {
                log.error("Failed to create Stripe session for ecommerce order", e);
                payment.setStatus("FAILED");
                payment.setErrorDescription(e.getMessage());
            }
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
            Event event;
            try {
                event = Webhook.constructEvent(payload, signature, endpointSecret);
            } catch (SignatureVerificationException e) {
                log.warn("Invalid Stripe signature in ecommerce webhook");
                throw new IllegalArgumentException("Invalid signature");
            } catch (Exception e) {
                log.error("Webhook processing error in ecommerce", e);
                throw new IllegalArgumentException("Invalid payload");
            }

            if ("checkout.session.completed".equals(event.getType())) {
                Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
                if (session != null && session.getClientReferenceId() != null && session.getClientReferenceId().startsWith("ECOMM_")) {
                    Long orderId = Long.parseLong(session.getClientReferenceId().substring(6));
                    
                    EcPayment payment = paymentRepository.findByOrderIdAndPaymentMethod(orderId, "STRIPE")
                            .orElse(null);
                    
                    if (payment != null) {
                        // Store actual session ID for refunds later
                        payment.setProviderRef(session.getId());
                        processPaymentOutcome(payment, "SUCCESS", payload);
                    }
                }
            }
        }
    }

    private void processPaymentOutcome(EcPayment payment, String status, String payload) {
        try {

            if ("CAPTURED".equals(payment.getStatus()) || "FAILED".equals(payment.getStatus())) {
                log.info("Payment {} already processed. Idempotent return.", payment.getId());
                return; // Already processed
            }

            payment.setWebhookVerified(true);
            payment.setPgResponse(payload);

            EcommerceOrder order = orderRepository.findById(payment.getOrderId()).orElseThrow();

            if ("SUCCESS".equalsIgnoreCase(status)) {
                payment.setStatus("CAPTURED");
                payment.setCapturedAt(ZonedDateTime.now());
                order.setPaymentStatus("PAID");
                order.setStatus("CONFIRMED");
                
                // Convert reservation to actual sale
                inventoryService.convertReservationToSale(order.getPatientId(), order.getId()); // Using patientId as pseudo-cartId for now if Cart was cleared
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
