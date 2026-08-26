package com.healthcare.clinic.pharmacy.controller;


import com.healthcare.clinic.pharmacy.entity.*;
import com.healthcare.clinic.pharmacy.model.*;

import com.healthcare.clinic.common.dto.ApiResponse;
import com.healthcare.clinic.pharmacy.model.CreditBill;
import com.healthcare.clinic.pharmacy.model.PaymentTransaction;
import com.healthcare.clinic.pharmacy.enums.PaymentMode;
import com.healthcare.clinic.pharmacy.enums.PaymentStatus;
import com.healthcare.clinic.pharmacy.exception.ResourceNotFoundException;
import com.healthcare.clinic.pharmacy.repository.CreditBillRepository;
import com.healthcare.clinic.pharmacy.repository.PaymentTransactionRepository;
import com.healthcare.clinic.pharmacy.repository.PharmacyBillRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController("pharmacyCreditBillController")
@RequestMapping("/api/pharmacy/credit-bills")
public class CreditBillController {

    private final CreditBillRepository creditBillRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final PharmacyBillRepository billRepository;

    public CreditBillController(CreditBillRepository creditBillRepository, 
                                PaymentTransactionRepository transactionRepository, 
                                PharmacyBillRepository billRepository) {
        this.creditBillRepository = creditBillRepository;
        this.transactionRepository = transactionRepository;
        this.billRepository = billRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<CreditBill>>> getAllCreditBills(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(creditBillRepository.findAll(pageable), "Credit bills fetched"));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_BILLING_STAFF','ROLE_SUPERVISOR')")
    @PostMapping("/{id}/payment")
    @Transactional
    public ResponseEntity<ApiResponse<PaymentTransaction>> addPayment(
            @PathVariable Long id,
            @RequestParam BigDecimal amount,
            @RequestParam PaymentMode mode,
            @RequestParam(required = false) String reference) {
        
        CreditBill creditBill = creditBillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Credit bill not found"));

        PaymentTransaction tx = new PaymentTransaction();
        tx.setCreditBill(creditBill);
        tx.setAmount(amount);
        tx.setPaymentMode(mode);
        tx.setPaymentDate(LocalDateTime.now());
        tx.setTransactionReference(reference);
        
        transactionRepository.save(tx);

        creditBill.setPaidAmount(creditBill.getPaidAmount().add(amount));
        creditBill.setBalanceAmount(creditBill.getBalanceAmount().subtract(amount));
        
        if (creditBill.getBalanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
            creditBill.setStatus(PaymentStatus.PAID);
            creditBill.getBill().setPaymentStatus(PaymentStatus.PAID);
        } else {
            creditBill.setStatus(PaymentStatus.PARTIAL);
            creditBill.getBill().setPaymentStatus(PaymentStatus.PARTIAL);
        }
        
        billRepository.save(creditBill.getBill());
        creditBillRepository.save(creditBill);

        return ResponseEntity.ok(ApiResponse.success(tx, "Payment recorded successfully"));
    }
}
