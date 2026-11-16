package com.healthcare.clinic.finance.service;

import com.healthcare.clinic.billing.entity.Invoice;
import com.healthcare.clinic.billing.entity.InvoiceStatus;
import com.healthcare.clinic.billing.repository.InvoiceRepository;
import com.healthcare.clinic.finance.entity.Payment;
import com.healthcare.clinic.finance.entity.PaymentStatus;
import com.healthcare.clinic.finance.repository.PaymentRepository;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrder;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrderStatus;
import com.healthcare.clinic.doctor.medicine.repository.MedicineOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class StripePaymentService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final MedicineOrderRepository medicineOrderRepository;

    @Value("${stripe.secret-key:sk_test_placeholder}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret:whsec_placeholder}")
    private String endpointSecret;

    @Value("${stripe.publishable-key:pk_test_placeholder}")
    private String stripePublishableKey;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        log.info("StripePaymentService initialized (Stripe SDK stubbed)");
    }

    public String createCheckoutSession(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found"));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invoice is already paid");
        }

        String mockSessionUrl = frontendUrl + "/checkout/mock-stripe?invoiceId=" + invoiceId + "&token=" + UUID.randomUUID();
        log.info("[STUB] Created Stripe Checkout session URL for Invoice {}: {}", invoiceId, mockSessionUrl);
        return mockSessionUrl;
    }

    public String createMedicineCheckoutSession(Long orderId) {
        MedicineOrder order = medicineOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine Order not found"));

        if (order.getStatus() == MedicineOrderStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order is already paid");
        }

        String mockSessionUrl = frontendUrl + "/checkout/mock-stripe?orderId=" + orderId + "&token=" + UUID.randomUUID();
        log.info("[STUB] Created Stripe Checkout session URL for Medicine Order {}: {}", orderId, mockSessionUrl);
        return mockSessionUrl;
    }

    @Transactional
    public void processWebhook(String payload, String signature) {
        log.info("[STUB] Stripe webhook received (Stripe SDK removed). Payload length: {}", payload != null ? payload.length() : 0);
    }
}
