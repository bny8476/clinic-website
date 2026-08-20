package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.doctor.entity.ClinicalEncounter;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.ClinicalEncounterRepository;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.doctor.entity.Prescription;
import com.healthcare.clinic.identity.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClinicalEncounterService {

    private final ClinicalEncounterRepository encounterRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PrescriptionService prescriptionService;
    private final ClinicalBillingService billingService;
    private final com.healthcare.clinic.doctor.repository.SoapNoteRepository soapNoteRepository;
    private final com.healthcare.clinic.appointment.service.AppointmentService appointmentService;

    private DoctorProfile getDoctorProfile(Long userId) {
        return doctorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
    }

    public List<ClinicalEncounter> getMyEncounters(Long userId) {
        DoctorProfile doctor = getDoctorProfile(userId);
        return encounterRepository.findByDoctorIdOrderByCreatedAtDesc(doctor.getId());
    }

    public ClinicalEncounter getEncounter(Long userId, Long id) {
        DoctorProfile doctor = getDoctorProfile(userId);
        ClinicalEncounter encounter = encounterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encounter not found"));
        
        if (!encounter.getDoctorId().equals(doctor.getId())) {
            throw new RuntimeException("Unauthorized to access this encounter");
        }
        
        return encounter;
    }

    @Transactional
    public ClinicalEncounter startEncounter(Long userId, ClinicalEncounter encounter) {
        if (encounter.getAppointmentId() != null) {
             java.util.Optional<ClinicalEncounter> existing = encounterRepository.findByAppointmentId(encounter.getAppointmentId());
             if (existing.isPresent()) {
                 return existing.get();
             }
        }
        DoctorProfile doctor = getDoctorProfile(userId);
        encounter.setDoctorId(doctor.getId());
        encounter.setStatus(com.healthcare.clinic.doctor.entity.EncounterStatus.IN_PROGRESS);
        return encounterRepository.save(encounter);
    }

    @Transactional
    public ClinicalEncounter closeEncounter(Long userId, Long id) {
        ClinicalEncounter encounter = getEncounter(userId, id);
        if ("CLOSED".equals(encounter.getStatus()) || "Completed".equals(encounter.getStatus())) {
            throw new RuntimeException("Encounter is already closed");
        }
        
        // Validate SOAP Note
        com.healthcare.clinic.doctor.entity.SoapNote soapNote = soapNoteRepository.findByEncounterId(id)
                .orElseThrow(() -> new RuntimeException("SOAP note is required to close the encounter"));
                
        if (soapNote.getSubjective() == null || soapNote.getSubjective().trim().isEmpty() ||
            soapNote.getObjective() == null || soapNote.getObjective().trim().isEmpty() ||
            soapNote.getAssessment() == null || soapNote.getAssessment().trim().isEmpty() ||
            soapNote.getPlan() == null || soapNote.getPlan().trim().isEmpty()) {
            throw new RuntimeException("All SOAP note sections (Subjective, Objective, Assessment, Plan) must be filled before closing.");
        }
        
        // Finalize SOAP note
        soapNote.setFinalized(true);
        soapNoteRepository.save(soapNote);
        
        // Finalize all draft prescriptions for this encounter
        List<Prescription> prescriptions = prescriptionService.getPrescriptionsByEncounter(id);
        for (Prescription p : prescriptions) {
            if ("Draft".equals(p.getStatus())) {
                prescriptionService.signPrescription(p.getId());
            }
        }

        // Create billing outbox entry for consultation
        billingService.createBillingEvent(
                encounter.getId(),
                encounter.getPatientId(),
                encounter.getDoctorId(),
                "Consultation",
                "CONS-01",
                java.math.BigDecimal.ZERO // Fee determined dynamically by processor job
        );

        encounter.setStatus(com.healthcare.clinic.doctor.entity.EncounterStatus.CLOSED);
        encounter.setClosedAt(ZonedDateTime.now());
        encounter.setFinalizedAt(ZonedDateTime.now()); // legacy compatibility
        
        ClinicalEncounter saved = encounterRepository.save(encounter);
        
        if (saved.getAppointmentId() != null) {
            try {
                appointmentService.updateAppointmentStatus(saved.getAppointmentId(), com.healthcare.clinic.appointment.entity.AppointmentStatus.COMPLETED);
            } catch (Exception e) {
                // Log and continue, do not block encounter closing
                System.err.println("Failed to update appointment status: " + e.getMessage());
            }
        }
        
        return saved;
    }
}
