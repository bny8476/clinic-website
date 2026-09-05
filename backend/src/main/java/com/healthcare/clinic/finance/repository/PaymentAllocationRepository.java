package com.healthcare.clinic.finance.repository;

import com.healthcare.clinic.finance.entity.PaymentAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentAllocationRepository extends JpaRepository<PaymentAllocation, Long> {
    List<PaymentAllocation> findByPaymentId(Long paymentId);
    List<PaymentAllocation> findByInvoiceId(Long invoiceId);

    @Query("SELECT COALESCE(SUM(pa.amount), 0) FROM PaymentAllocation pa WHERE pa.payment.id = :paymentId")
    BigDecimal sumAmountByPaymentId(@Param("paymentId") Long paymentId);
}
