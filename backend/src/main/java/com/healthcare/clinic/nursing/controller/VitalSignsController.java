package com.healthcare.clinic.nursing.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.nursing.entity.VitalSign;
import com.healthcare.clinic.nursing.repository.VitalSignRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.ZonedDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/patients/{patientId}/vitals")
@RequiredArgsConstructor
public class VitalSignsController {

    private final VitalSignRepository vitalSignRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final com.healthcare.clinic.identity.repository.UserRepository userRepository;

    @GetMapping
    @PreAuthorize("@nursingSecurity.isAssigned(authentication, #patientId) or hasRole('DOCTOR')")
    public ResponseEntity<List<VitalSign>> getVitalSigns(@PathVariable Long patientId) {
        return ResponseEntity.ok(vitalSignRepository.findByPatientIdOrderByRecordedAtDesc(patientId));
    }

    @PostMapping
    @PreAuthorize("@nursingSecurity.isAssigned(authentication, #patientId)")
    public ResponseEntity<?> addVitalSign(@PathVariable Long patientId, 
                                          @RequestParam(required = false) Long appointmentId,
                                          @RequestBody VitalSign vitalSign, 
                                          @AuthenticationPrincipal com.healthcare.clinic.security.UserPrincipal nursePrincipal) {
        com.healthcare.clinic.patient.entity.PatientProfile patient = patientProfileRepository.findById(patientId).orElse(null);
        if (patient == null) return ResponseEntity.notFound().build();

        com.healthcare.clinic.identity.entity.User nurse = userRepository.findById(nursePrincipal.getUserId())
            .orElseThrow(() -> new RuntimeException("Nurse not found"));

        vitalSign.setPatient(patient);
        vitalSign.setNurse(nurse);
        vitalSign.setRecordedAt(ZonedDateTime.now());
        
        if (appointmentId != null) {
            Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
            if (appointment != null) {
                vitalSign.setAppointment(appointment);
            }
        }
        
        return ResponseEntity.ok(vitalSignRepository.save(vitalSign));
    }
}
