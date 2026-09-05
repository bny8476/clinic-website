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

import com.healthcare.clinic.finance.repository.PaymentAllocationRepository;
import org.springframework.dao.DataIntegrityViolationException;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final UnifiedBillingService unifiedBillingService;

    @Transactional
    public Payment initiatePayment(BigDecimal amount, String paymentMethod, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            var existing = paymentRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                throw new IllegalStateException("Payment already initiated with this idempotency key");
            }
        }
        
        Payment payment = Payment.builder()
                .paymentReference(UUID.randomUUID().toString())
                .amount(amount)
                .paymentMethod(paymentMethod)
                .status(PaymentStatus.INITIATED)
                .idempotencyKey(idempotencyKey)
                .build();
                
        try {
            return paymentRepository.save(payment);
        } catch (DataIntegrityViolationException e) {
            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                log.warn("Database unique constraint prevented duplicate payment insertion for idempotency key: {}", idempotencyKey);
                return paymentRepository.findByIdempotencyKey(idempotencyKey)
                        .orElseThrow(() -> new IllegalStateException("Payment already initiated with this idempotency key"));
            }
            throw e;
        }
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
        if (allocationAmount == null || allocationAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Allocation amount must be positive");
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
                
        if (payment.getStatus() != PaymentStatus.CAPTURED && payment.getStatus() != PaymentStatus.RECONCILED) {
            throw new IllegalStateException("Payment must be captured before allocation");
        }
        
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        // 1. Enforce allocated amount <= remaining payment amount
        BigDecimal totalAlreadyAllocated = paymentAllocationRepository.sumAmountByPaymentId(paymentId);
        BigDecimal remainingPayment = payment.getAmount().subtract(totalAlreadyAllocated);
        if (allocationAmount.compareTo(remainingPayment) > 0) {
            throw new IllegalArgumentException("Allocated amount (" + allocationAmount + ") exceeds remaining payment balance (" + remainingPayment + ")");
        }

        // 2. Enforce allocated amount <= invoice outstanding balance
        BigDecimal outstandingInvoice = invoice.getOutstandingBalance();
        if (outstandingInvoice == null || outstandingInvoice.compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal paid = invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO;
            outstandingInvoice = invoice.getTotalAmount().subtract(paid);
        }
        if (allocationAmount.compareTo(outstandingInvoice) > 0) {
            throw new IllegalArgumentException("Allocated amount (" + allocationAmount + ") exceeds invoice outstanding balance (" + outstandingInvoice + ")");
        }
        
        PaymentAllocation allocation = PaymentAllocation.builder()
                .payment(payment)
                .invoice(invoice)
                .amount(allocationAmount)
                .build();

        // 3. Persist allocation before returning
        allocation = paymentAllocationRepository.save(allocation);
                
        // 4. Update invoice balance
        unifiedBillingService.recordPayment(invoiceId, allocationAmount);
        
        return allocation;
    }
}
