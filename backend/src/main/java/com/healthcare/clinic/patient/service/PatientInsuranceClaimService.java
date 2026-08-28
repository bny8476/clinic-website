package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.patient.entity.PatientInsuranceClaim;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientInsuranceClaimRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientInsuranceClaimService {

    private final PatientInsuranceClaimRepository claimRepository;
    private final PatientProfileRepository patientProfileRepository;

    private PatientProfile getPatientProfile(Long userId) {
        return patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Patient profile not found for user"));
    }

    public List<PatientInsuranceClaim> getClaims(Long userId) {
        PatientProfile profile = getPatientProfile(userId);
        return claimRepository.findByPatientIdOrderBySubmittedAtDesc(profile.getId());
    }

    @Transactional
    public PatientInsuranceClaim submitClaim(Long userId, PatientInsuranceClaim claim) {
        PatientProfile profile = getPatientProfile(userId);
        claim.setPatientId(profile.getId());
        claim.setStatus("Submitted");
        return claimRepository.save(claim);
    }
}
