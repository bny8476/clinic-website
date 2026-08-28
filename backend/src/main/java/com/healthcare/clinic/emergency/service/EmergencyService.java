package com.healthcare.clinic.emergency.service;

import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.emergency.entity.EmergencyEncounter;
import com.healthcare.clinic.emergency.entity.EmergencyOrder;
import com.healthcare.clinic.emergency.entity.TriageAssessment;
import com.healthcare.clinic.emergency.repository.EmergencyEncounterRepository;
import com.healthcare.clinic.emergency.repository.EmergencyOrderRepository;
import com.healthcare.clinic.emergency.repository.TriageAssessmentRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmergencyService {

    private final EmergencyEncounterRepository encounterRepository;
    private final TriageAssessmentRepository triageRepository;
    private final EmergencyOrderRepository orderRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<EmergencyEncounter> getEncounters(Long branchId, String status) {
        if (status != null && !status.isEmpty()) {
            return encounterRepository.findByBranchIdAndStatusOrderByArrivedAtDesc(branchId, status);
        }
        return encounterRepository.findByBranchIdOrderByArrivedAtDesc(branchId);
    }

    @Transactional
    public EmergencyEncounter registerPatient(Long patientId, String arrivalMode, Long branchId) {
        PatientProfile patient = null;
        if (patientId != null) {
            patient = patientProfileRepository.findById(patientId).orElse(null);
        }

        EmergencyEncounter encounter = EmergencyEncounter.builder()
                .patient(patient)
                .arrivalMode(arrivalMode)
                .status("REGISTERED")
                .branchId(branchId)
                .build();

        return encounterRepository.save(encounter);
    }

    @Transactional
    public TriageAssessment performTriage(Long encounterId, String triageLevel, String chiefComplaint, UserPrincipal triagedByPrincipal) {
        EmergencyEncounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new RuntimeException("Encounter not found"));

        if (!"REGISTERED".equals(encounter.getStatus())) {
            throw new RuntimeException("Cannot triage a patient who is not in REGISTERED status");
        }

        User triagedBy = triagedByPrincipal != null && triagedByPrincipal.getUserId() != null
                ? userRepository.findById(triagedByPrincipal.getUserId()).orElse(null)
                : null;

        TriageAssessment triage = TriageAssessment.builder()
                .emergencyEncounter(encounter)
                .triagedBy(triagedBy)
                .triageLevel(triageLevel)
                .chiefComplaint(chiefComplaint)
                .build();

        encounter.setStatus("IN_TRIAGE");
        encounterRepository.save(encounter);

        return triageRepository.save(triage);
    }
    
    @Transactional
    public EmergencyEncounter assignDoctor(Long encounterId, Long doctorId) {
        EmergencyEncounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new RuntimeException("Encounter not found"));
        
        DoctorProfile doctor = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        encounter.setAssignedDoctor(doctor);
        encounter.setStatus("IN_TREATMENT");
        return encounterRepository.save(encounter);
    }

    @Transactional
    public EmergencyOrder placeOrder(Long encounterId, String orderType, Long referenceId, UserPrincipal orderedByPrincipal) {
        EmergencyEncounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new RuntimeException("Encounter not found"));

        User orderedBy = orderedByPrincipal != null && orderedByPrincipal.getUserId() != null
                ? userRepository.findById(orderedByPrincipal.getUserId()).orElse(null)
                : null;

        EmergencyOrder order = EmergencyOrder.builder()
                .emergencyEncounter(encounter)
                .orderedBy(orderedBy)
                .orderType(orderType)
                .referenceId(referenceId)
                .build();

        return orderRepository.save(order);
    }

    @Transactional
    public EmergencyEncounter setDisposition(Long encounterId, String disposition) {
        EmergencyEncounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new RuntimeException("Encounter not found"));

        encounter.setDisposition(disposition);
        encounter.setStatus("DISPOSITIONED");
        return encounterRepository.save(encounter);
    }
}
