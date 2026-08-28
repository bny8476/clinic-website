package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.patient.entity.PatientAllergy;
import com.healthcare.clinic.patient.repository.PatientAllergyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientAllergyService {

    private final PatientAllergyRepository allergyRepository;

    public List<PatientAllergy> getActiveAllergies(Long patientId) {
        return allergyRepository.findByPatientIdAndStatusNot(patientId, "Entered_in_Error");
    }

    public List<PatientAllergy> getAllAllergies(Long patientId) {
        return allergyRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    @Transactional
    public PatientAllergy addAllergy(UserPrincipal doctor, PatientAllergy allergy) {
        allergy.setRecordedBy(doctor.getUserId());
        return allergyRepository.save(allergy);
    }

    @Transactional
    public PatientAllergy markAsError(Long allergyId) {
        PatientAllergy allergy = allergyRepository.findById(allergyId)
                .orElseThrow(() -> new RuntimeException("Allergy not found"));
        allergy.setStatus("Entered_in_Error");
        return allergyRepository.save(allergy);
    }

    @Transactional
    public PatientAllergy verifyAllergy(Long allergyId) {
        PatientAllergy allergy = allergyRepository.findById(allergyId)
                .orElseThrow(() -> new RuntimeException("Allergy not found"));
        allergy.setVerificationStatus("Verified");
        return allergyRepository.save(allergy);
    }
}
