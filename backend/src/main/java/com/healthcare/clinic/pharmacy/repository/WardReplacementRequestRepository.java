package com.healthcare.clinic.pharmacy.repository;

import com.healthcare.clinic.pharmacy.entity.WardReplacementRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WardReplacementRequestRepository extends JpaRepository<WardReplacementRequest, Long> {
    List<WardReplacementRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<WardReplacementRequest> findAllByOrderByCreatedAtDesc();
}
