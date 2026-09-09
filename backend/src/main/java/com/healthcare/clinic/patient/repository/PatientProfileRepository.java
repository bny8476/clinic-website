package com.healthcare.clinic.patient.repository;

import com.healthcare.clinic.patient.entity.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientProfileRepository extends JpaRepository<PatientProfile, Long> {
    Optional<PatientProfile> findByUserId(Long userId);
    Optional<PatientProfile> findByOpNumber(String opNumber);
    java.util.List<PatientProfile> findByUserIdIn(java.util.List<Long> userIds);
}
