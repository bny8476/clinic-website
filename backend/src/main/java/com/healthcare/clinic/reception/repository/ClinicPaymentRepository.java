package com.healthcare.clinic.reception.repository;

import com.healthcare.clinic.reception.entity.ClinicPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClinicPaymentRepository extends JpaRepository<ClinicPayment, Long> {
    List<ClinicPayment> findByBillId(Long billId);
    List<ClinicPayment> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
