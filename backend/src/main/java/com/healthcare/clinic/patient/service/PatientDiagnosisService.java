package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.patient.entity.PatientDiagnosis;
import com.healthcare.clinic.patient.repository.PatientDiagnosisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientDiagnosisService {

    private final PatientDiagnosisRepository diagnosisRepository;

    public List<PatientDiagnosis> getDiagnosesForPatient(Long patientId) {
        return diagnosisRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public List<PatientDiagnosis> getDiagnosesForEncounter(Long encounterId) {
        return diagnosisRepository.findByEncounterId(encounterId);
    }

    @Transactional
    public PatientDiagnosis addDiagnosis(UserPrincipal doctor, PatientDiagnosis diagnosis) {
        diagnosis.setRecordedBy(doctor.getUserId());
        return diagnosisRepository.save(diagnosis);
    }

    @Transactional
    public PatientDiagnosis resolveDiagnosis(Long diagnosisId) {
        PatientDiagnosis diagnosis = diagnosisRepository.findById(diagnosisId)
                .orElseThrow(() -> new RuntimeException("Diagnosis not found"));
        diagnosis.setClinicalStatus("Resolved");
        return diagnosisRepository.save(diagnosis);
    }
}
