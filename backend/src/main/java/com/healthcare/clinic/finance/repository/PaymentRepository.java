package com.healthcare.clinic.finance.repository;

import com.healthcare.clinic.finance.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    java.util.Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    List<Payment> findAllByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Payment p WHERE p.id = :id")
    java.util.Optional<Payment> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);
}
