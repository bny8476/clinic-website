package com.healthcare.clinic.finance.service;

import com.healthcare.clinic.billing.entity.Invoice;
import com.healthcare.clinic.billing.repository.InvoiceRepository;
import com.healthcare.clinic.billing.service.UnifiedBillingService;
import com.healthcare.clinic.finance.entity.Payment;
import com.healthcare.clinic.finance.entity.PaymentAllocation;
import com.healthcare.clinic.finance.entity.PaymentStatus;
import com.healthcare.clinic.finance.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final UnifiedBillingService unifiedBillingService;

    @Transactional
    public Payment initiatePayment(BigDecimal amount, String paymentMethod, String idempotencyKey) {
        // Simple idempotency check
        if (idempotencyKey != null) {
            paymentRepository.findByIdempotencyKey(idempotencyKey).ifPresent(p -> {
                throw new IllegalStateException("Payment already initiated with this idempotency key");
            });
        }
        
        Payment payment = Payment.builder()
                .paymentReference(UUID.randomUUID().toString())
                .amount(amount)
                .paymentMethod(paymentMethod)
                .status(PaymentStatus.INITIATED)
                .idempotencyKey(idempotencyKey)
                .build();
                
        return paymentRepository.save(payment);
    }
    
    @Transactional
    public Payment capturePayment(Long paymentId, String transactionRef) {
        Payment payment = paymentRepository.findByIdWithLock(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
                
        if (payment.getStatus() != PaymentStatus.INITIATED && payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Payment cannot be captured in its current state");
        }
        
        payment.setStatus(PaymentStatus.CAPTURED);
        payment.setTransactionRef(transactionRef);
        return paymentRepository.save(payment);
    }
    
    @Transactional
    public PaymentAllocation allocatePaymentToInvoice(Long paymentId, Long invoiceId, BigDecimal allocationAmount) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
                
        if (payment.getStatus() != PaymentStatus.CAPTURED && payment.getStatus() != PaymentStatus.RECONCILED) {
            throw new IllegalStateException("Payment must be captured before allocation");
        }
        
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
                
        // In a real app we'd verify that the total allocated amount doesn't exceed payment amount
        
        PaymentAllocation allocation = PaymentAllocation.builder()
                .payment(payment)
                .invoice(invoice)
                .amount(allocationAmount)
                .build();
                
        // Here we need to update the invoice balance
        unifiedBillingService.recordPayment(invoiceId, allocationAmount);
        
        // Return allocation (normally saved to DB first)
        return allocation;
    }
}
