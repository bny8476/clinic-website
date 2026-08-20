package com.healthcare.clinic.doctor.repository;

import com.healthcare.clinic.doctor.entity.PrescriptionRefillRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRefillRequestRepository extends JpaRepository<PrescriptionRefillRequest, Long> {
    List<PrescriptionRefillRequest> findByPatientIdOrderByRequestedAtDesc(Long patientId);
    List<PrescriptionRefillRequest> findByPrescriptionIdOrderByRequestedAtDesc(Long prescriptionId);
}
