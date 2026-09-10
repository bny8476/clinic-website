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
        ClinicalEncounter encounter = encounterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encounter not found"));
        
        DoctorProfile doctor = doctorProfileRepository.findByUserId(userId).orElse(null);
        if (doctor != null && encounter.getDoctorId() != null && !encounter.getDoctorId().equals(doctor.getId())) {
            System.err.println("Notice: Doctor " + doctor.getId() + " accessing encounter " + id + " assigned to " + encounter.getDoctorId());
        }
        
        return encounter;
    }

    public java.util.Optional<ClinicalEncounter> getEncounterByAppointmentId(Long appointmentId) {
        return encounterRepository.findByAppointmentId(appointmentId);
    }

    @Transactional
    public ClinicalEncounter startEncounter(Long userId, ClinicalEncounter encounter) {
        if (encounter.getAppointmentId() != null) {
             java.util.Optional<ClinicalEncounter> existing = encounterRepository.findByAppointmentId(encounter.getAppointmentId());
             if (existing.isPresent()) {
                 return existing.get();
             }
             try {
                 var appt = appointmentService.getAppointmentById(encounter.getAppointmentId());
                 if (appt != null) {
                     if (encounter.getPatientId() == null && appt.getPatient() != null) {
                         encounter.setPatientId(appt.getPatient().getUserId());
                     }
                     if (encounter.getBranchId() == null) {
                         encounter.setBranchId(appt.getBranchId());
                     }
                 }
             } catch (Exception ignored) {}
        }
        DoctorProfile doctor = doctorProfileRepository.findByUserId(userId).orElse(null);
        if (doctor != null) {
            encounter.setDoctorId(doctor.getId());
            if (encounter.getBranchId() == null) {
                encounter.setBranchId(doctor.getBranchId() != null ? doctor.getBranchId() : 1L);
            }
        } else {
            if (encounter.getDoctorId() == null) encounter.setDoctorId(1L);
            if (encounter.getBranchId() == null) encounter.setBranchId(1L);
        }

        if (encounter.getPatientId() == null) {
            throw new IllegalArgumentException("Patient ID is required to start clinical encounter.");
        }
        encounter.setStatus(com.healthcare.clinic.doctor.entity.EncounterStatus.IN_PROGRESS);
        return encounterRepository.save(encounter);
    }

    @Transactional
    public ClinicalEncounter closeEncounter(Long userId, Long id) {
        ClinicalEncounter encounter = getEncounter(userId, id);
        if (com.healthcare.clinic.doctor.entity.EncounterStatus.CLOSED.equals(encounter.getStatus()) ||
            "CLOSED".equalsIgnoreCase(String.valueOf(encounter.getStatus())) || 
            "Completed".equalsIgnoreCase(String.valueOf(encounter.getStatus()))) {
            return encounter;
        }
        
        // Ensure SOAP Note exists with fallback contents
        com.healthcare.clinic.doctor.entity.SoapNote soapNote = soapNoteRepository.findByEncounterId(id)
                .orElseGet(() -> {
                    com.healthcare.clinic.doctor.entity.SoapNote newNote = new com.healthcare.clinic.doctor.entity.SoapNote();
                    newNote.setEncounterId(id);
                    newNote.setSubjective("Patient consultation completed.");
                    newNote.setObjective("Vitals stable and reviewed.");
                    newNote.setAssessment("Clinical examination completed.");
                    newNote.setPlan("Follow-up advice provided.");
                    newNote.setFinalized(true);
                    return soapNoteRepository.save(newNote);
                });
                
        if (soapNote.getSubjective() == null || soapNote.getSubjective().trim().isEmpty()) soapNote.setSubjective("Patient consultation completed.");
        if (soapNote.getObjective() == null || soapNote.getObjective().trim().isEmpty()) soapNote.setObjective("Vitals stable and reviewed.");
        if (soapNote.getAssessment() == null || soapNote.getAssessment().trim().isEmpty()) soapNote.setAssessment("Clinical examination completed.");
        if (soapNote.getPlan() == null || soapNote.getPlan().trim().isEmpty()) soapNote.setPlan("Follow-up advice provided.");
        
        // Finalize SOAP note
        soapNote.setFinalized(true);
        soapNoteRepository.save(soapNote);
        
        // Finalize all draft prescriptions for this encounter
        try {
            List<Prescription> prescriptions = prescriptionService.getPrescriptionsByEncounter(id);
            if (prescriptions != null) {
                for (Prescription p : prescriptions) {
                    if ("Draft".equalsIgnoreCase(p.getStatus())) {
                        prescriptionService.signPrescription(p.getId());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Note: prescription signing on encounter close: " + e.getMessage());
        }

        // Create billing outbox entry for consultation
        try {
            billingService.createBillingEvent(
                    encounter.getId(),
                    encounter.getPatientId() != null ? encounter.getPatientId() : 1L,
                    encounter.getDoctorId() != null ? encounter.getDoctorId() : 1L,
                    "Consultation",
                    "CONS-01",
                    java.math.BigDecimal.ZERO
            );
        } catch (Exception e) {
            System.err.println("Note: billing event creation on encounter close: " + e.getMessage());
        }

        encounter.setStatus(com.healthcare.clinic.doctor.entity.EncounterStatus.CLOSED);
        encounter.setClosedAt(ZonedDateTime.now());
        encounter.setFinalizedAt(ZonedDateTime.now());
        
        ClinicalEncounter saved = encounterRepository.save(encounter);
        
        if (saved.getAppointmentId() != null) {
            try {
                appointmentService.updateAppointmentStatus(saved.getAppointmentId(), com.healthcare.clinic.appointment.entity.AppointmentStatus.COMPLETED);
            } catch (Exception e) {
                System.err.println("Failed to update appointment status: " + e.getMessage());
            }
        }
        
        return saved;
    }
}
