package com.healthcare.clinic.finance.service;

import com.healthcare.clinic.billing.entity.Invoice;
import com.healthcare.clinic.billing.entity.InvoiceStatus;
import com.healthcare.clinic.billing.repository.InvoiceRepository;
import com.healthcare.clinic.finance.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StripePaymentServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private StripePaymentService stripePaymentService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(stripePaymentService, "stripeSecretKey", "sk_test_123");
        ReflectionTestUtils.setField(stripePaymentService, "endpointSecret", "whsec_123");
        ReflectionTestUtils.setField(stripePaymentService, "frontendUrl", "http://localhost:3000");
        stripePaymentService.init();
    }

    @Test
    void testCreateCheckoutSession_Success() {
        Invoice invoice = new Invoice();
        invoice.setId(1L);
        invoice.setInvoiceNumber("INV-1001");
        invoice.setTotalAmount(new BigDecimal("150.00"));
        invoice.setStatus(InvoiceStatus.ISSUED);

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        String url = stripePaymentService.createCheckoutSession(1L);
        assertNotNull(url);
        assertTrue(url.contains("mock-stripe"));
    }

    @Test
    void testCreateCheckoutSession_AlreadyPaid() {
        Invoice invoice = new Invoice();
        invoice.setId(1L);
        invoice.setStatus(InvoiceStatus.PAID);

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        assertThrows(ResponseStatusException.class, () -> {
            stripePaymentService.createCheckoutSession(1L);
        });
    }
}
