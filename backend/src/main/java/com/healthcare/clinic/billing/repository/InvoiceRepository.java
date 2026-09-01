package com.healthcare.clinic.billing.repository;

import com.healthcare.clinic.billing.entity.Invoice;
import com.healthcare.clinic.billing.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Invoice> findByStatus(InvoiceStatus status);
    List<Invoice> findByBranchIdOrderByCreatedAtDesc(Long branchId);
    List<Invoice> findByAppointmentIdIn(List<Long> appointmentIds);

    @Query("SELECT SUM(i.totalAmount) FROM Invoice i WHERE i.status = 'PAID'")
    BigDecimal sumTotalPaid();

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = 'PENDING'")
    Long countPending();

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = 'OVERDUE'")
    Long countOverdue();

    java.util.Optional<Invoice> findFirstByInvoiceNumberStartingWithOrderByInvoiceNumberDesc(String prefix);
}
