package com.healthcare.clinic.doctor.repository;

import com.healthcare.clinic.emr.entity.ClinicalReferral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicalReferralRepository extends JpaRepository<ClinicalReferral, Long> {
    List<ClinicalReferral> findByPatientId(Long patientId);
    List<ClinicalReferral> findByEncounterId(Long encounterId);
    List<ClinicalReferral> findByReferringDoctorId(Long doctorId);
    List<ClinicalReferral> findByReferredToDoctorId(Long doctorId);
}
