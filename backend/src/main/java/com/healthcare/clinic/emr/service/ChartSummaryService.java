package com.healthcare.clinic.emr.service;

import com.healthcare.clinic.emr.dto.ChartSummaryDTO;
import com.healthcare.clinic.emr.entity.Allergy;
import com.healthcare.clinic.emr.entity.ExternalMedicationHistoryEntry;
import com.healthcare.clinic.emr.entity.Problem;
import com.healthcare.clinic.emr.repository.AllergyRepository;
import com.healthcare.clinic.emr.repository.ExternalMedicationHistoryEntryRepository;
import com.healthcare.clinic.emr.repository.ProblemRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChartSummaryService {

    private final PatientProfileRepository patientProfileRepository;
    private final AllergyRepository allergyRepository;
    private final ProblemRepository problemRepository;
    private final ExternalMedicationHistoryEntryRepository medicationRepository;

    public ChartSummaryDTO getChartSummary(Long patientId) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientId)
                .orElseThrow(() -> new com.healthcare.clinic.exception.ResourceNotFoundException("Patient not found"));

        List<Allergy> activeAllergies = allergyRepository.findByPatientId(patientId)
                .stream().filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
                .collect(Collectors.toList());

        List<Problem> activeProblems = problemRepository.findByPatientId(patientId)
                .stream().filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()) || "CHRONIC".equalsIgnoreCase(p.getStatus()))
                .collect(Collectors.toList());

        List<ExternalMedicationHistoryEntry> activeMeds = medicationRepository.findByPatientId(patientId)
                .stream().filter(ExternalMedicationHistoryEntry::getStillTaking)
                .collect(Collectors.toList());

        Integer age = null;
        if (patient.getDateOfBirth() != null) {
            age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        }

        return ChartSummaryDTO.builder()
                .patientId(patient.getId())
                .age(age)
                .bloodGroup(patient.getBloodGroup())
                .emergencyContactName(patient.getEmergencyContactName())
                .emergencyContactPhone(patient.getEmergencyContactPhone())
                .activeAllergies(activeAllergies)
                .activeProblems(activeProblems)
                .currentMedications(activeMeds)
                .build();
    }
}
