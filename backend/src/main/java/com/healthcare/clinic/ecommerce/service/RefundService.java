package com.healthcare.clinic.ecommerce.service;

import com.healthcare.clinic.ecommerce.entity.EcRefund;
import com.healthcare.clinic.ecommerce.repository.EcRefundRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stripe.Stripe;
import com.stripe.model.Refund;
import com.stripe.param.RefundCreateParams;
import com.healthcare.clinic.ecommerce.entity.EcPayment;
import com.healthcare.clinic.ecommerce.repository.EcPaymentRepository;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;

@Slf4j
@Service("ecommerceRefundService")
@RequiredArgsConstructor
public class RefundService {

    private final EcRefundRepository refundRepository;
    private final OrderService orderService;
    private final EcPaymentRepository paymentRepository;

    @Value("${ecommerce.payment.provider:STRIPE}")
    private String paymentProvider;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    @Transactional
    public EcRefund initiateRefund(Long orderId, Long returnId, BigDecimal amount, Long approvedBy) {
        String idempotencyKey = "REF_" + orderId + "_" + (returnId != null ? returnId : "CANC") + "_" + UUID.randomUUID().toString();
        
        EcRefund refund = EcRefund.builder()
                .orderId(orderId)
                .returnId(returnId)
                .idempotencyKey(idempotencyKey)
                .amount(amount)
                .method("ORIGINAL")
                .status("PROCESSING")
                .approvedBy(approvedBy)
                .build();
                
        refund = refundRepository.save(refund);

        // Process Refund
        if ("MOCK".equals(paymentProvider)) {
            try {
                log.info("Mock processing refund of {} for order {}", amount, orderId);
                refund.setStatus("SUCCESSFUL");
                refund.setProviderRef("MOCK_REF_" + UUID.randomUUID().toString().substring(0, 8));
                refund.setProcessedAt(ZonedDateTime.now());
                
                if (returnId == null) {
                    orderService.updateOrderStatus(orderId, "REFUNDED", approvedBy, "SYSTEM", "Refund processed successfully");
                }
            } catch (Exception e) {
                refund.setStatus("FAILED");
                refund.setFailureReason(e.getMessage());
            }
        } else if ("STRIPE".equalsIgnoreCase(paymentProvider)) {
            try {
                EcPayment payment = paymentRepository.findByOrderIdAndStatus(orderId, "CAPTURED")
                        .orElseThrow(() -> new IllegalArgumentException("No captured payment found for order " + orderId));
                
                String stripePaymentIntentOrSessionId = payment.getProviderRef();
                // Normally you'd retrieve the PaymentIntent from the Session if it's a checkout session,
                // Stripe Refund API allows refunding a PaymentIntent, or sometimes a Charge. 
                // Checkout Sessions don't have a direct refund method. We refund the PaymentIntent associated with it.
                // We'll pass the PaymentIntent or Charge to Stripe. 
                // Wait, Webhook saves session.getId(). We need to retrieve the PaymentIntent from the session.
                com.stripe.model.checkout.Session session = com.stripe.model.checkout.Session.retrieve(stripePaymentIntentOrSessionId);
                String paymentIntentId = session.getPaymentIntent();

                long amountInCents = amount.multiply(new BigDecimal("100")).longValue();

                RefundCreateParams params = RefundCreateParams.builder()
                        .setPaymentIntent(paymentIntentId)
                        .setAmount(amountInCents)
                        .setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER)
                        .build();

                Refund stripeRefund = Refund.create(params);
                
                refund.setStatus("SUCCESSFUL");
                refund.setProviderRef(stripeRefund.getId());
                refund.setProcessedAt(ZonedDateTime.now());
                
                if (returnId == null) {
                    orderService.updateOrderStatus(orderId, "REFUNDED", approvedBy, "SYSTEM", "Refund processed successfully");
                }
                log.info("Stripe refund processed successfully for order {}", orderId);
            } catch (Exception e) {
                log.error("Stripe refund failed", e);
                refund.setStatus("FAILED");
                refund.setFailureReason(e.getMessage());
            }
        } else {
            refund.setStatus("FAILED");
            refund.setFailureReason("Provider not implemented");
        }
        
        return refundRepository.save(refund);
    }
}
