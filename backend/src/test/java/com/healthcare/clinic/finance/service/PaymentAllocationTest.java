package com.healthcare.clinic.finance.service;

import com.healthcare.clinic.billing.entity.Invoice;
import com.healthcare.clinic.billing.entity.InvoiceStatus;
import com.healthcare.clinic.billing.repository.InvoiceRepository;
import com.healthcare.clinic.finance.entity.Payment;
import com.healthcare.clinic.finance.entity.PaymentAllocation;
import com.healthcare.clinic.finance.entity.PaymentStatus;
import com.healthcare.clinic.finance.repository.PaymentAllocationRepository;
import com.healthcare.clinic.finance.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PaymentAllocationTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentAllocationRepository paymentAllocationRepository;

    @Test
    public void testAllocatePaymentExceedingPaymentAmount() {
        Payment payment = Payment.builder()
                .paymentReference("REF-PAY-100")
                .amount(new BigDecimal("100.00"))
                .paymentMethod("CREDIT_CARD")
                .status(PaymentStatus.CAPTURED)
                .build();
        payment = paymentRepository.save(payment);

        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-ALLOC-1")
                .patientId(1L)
                .amount(new BigDecimal("200.00"))
                .totalAmount(new BigDecimal("200.00"))
                .outstandingBalance(new BigDecimal("200.00"))
                .amountPaid(BigDecimal.ZERO)
                .status(InvoiceStatus.ISSUED)
                .description("Test Invoice")
                .dueDate(LocalDateTime.now().plusDays(7))
                .build();
        invoice = invoiceRepository.save(invoice);

        Long paymentId = payment.getId();
        Long invoiceId = invoice.getId();

        // Attempting to allocate 150 from a 100 payment should throw IllegalArgumentException
        assertThatThrownBy(() -> paymentService.allocatePaymentToInvoice(paymentId, invoiceId, new BigDecimal("150.00")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds remaining payment balance");
    }

    @Test
    public void testAllocatePaymentExceedingInvoiceOutstandingBalance() {
        Payment payment = Payment.builder()
                .paymentReference("REF-PAY-500")
                .amount(new BigDecimal("500.00"))
                .paymentMethod("CREDIT_CARD")
                .status(PaymentStatus.CAPTURED)
                .build();
        payment = paymentRepository.save(payment);

        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-ALLOC-2")
                .patientId(1L)
                .amount(new BigDecimal("100.00"))
                .totalAmount(new BigDecimal("100.00"))
                .outstandingBalance(new BigDecimal("100.00"))
                .amountPaid(BigDecimal.ZERO)
                .status(InvoiceStatus.ISSUED)
                .description("Test Invoice")
                .dueDate(LocalDateTime.now().plusDays(7))
                .build();
        invoice = invoiceRepository.save(invoice);

        Long paymentId = payment.getId();
        Long invoiceId = invoice.getId();

        // Attempting to allocate 150 to a 100 outstanding invoice should throw IllegalArgumentException
        assertThatThrownBy(() -> paymentService.allocatePaymentToInvoice(paymentId, invoiceId, new BigDecimal("150.00")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds invoice outstanding balance");
    }

    @Test
    public void testSuccessfulPaymentAllocationAndPersistence() {
        Payment payment = Payment.builder()
                .paymentReference("REF-PAY-300")
                .amount(new BigDecimal("300.00"))
                .paymentMethod("CREDIT_CARD")
                .status(PaymentStatus.CAPTURED)
                .build();
        payment = paymentRepository.save(payment);

        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-ALLOC-3")
                .patientId(1L)
                .amount(new BigDecimal("200.00"))
                .totalAmount(new BigDecimal("200.00"))
                .outstandingBalance(new BigDecimal("200.00"))
                .amountPaid(BigDecimal.ZERO)
                .status(InvoiceStatus.ISSUED)
                .description("Test Invoice")
                .dueDate(LocalDateTime.now().plusDays(7))
                .build();
        invoice = invoiceRepository.save(invoice);

        PaymentAllocation allocation = paymentService.allocatePaymentToInvoice(payment.getId(), invoice.getId(), new BigDecimal("150.00"));
        assertThat(allocation.getId()).isNotNull();
        assertThat(allocation.getAmount()).isEqualByComparingTo("150.00");

        // Verify persisted allocation
        var foundAllocation = paymentAllocationRepository.findById(allocation.getId());
        assertThat(foundAllocation).isPresent();

        // Verify remaining payment balance check on second allocation
        Long paymentId = payment.getId();
        Long invoiceId = invoice.getId();
        assertThatThrownBy(() -> paymentService.allocatePaymentToInvoice(paymentId, invoiceId, new BigDecimal("200.00")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds remaining payment balance");
    }
}
