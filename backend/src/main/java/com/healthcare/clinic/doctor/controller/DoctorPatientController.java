package com.healthcare.clinic.doctor.controller;

import com.healthcare.clinic.doctor.dto.MyPatientResponse;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.appointment.entity.AppointmentStatus;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.doctor.repository.PrescriptionRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.patient.repository.PatientDocumentRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/doctor/patients")
@RequiredArgsConstructor
public class DoctorPatientController {

    private final AppointmentRepository appointmentRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final UserRepository userRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PatientDocumentRepository patientDocumentRepository;

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<MyPatientResponse>> getMyPatients() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        
        // Let's get distinct patients for this doctor
        // Using JPA query to fetch patients mapped to appointments with the doctor.
        // We will implement this safely using Java streams after finding appointments.
        // Using JPA query to fetch appointments specifically mapped to this doctor
        var appointments = appointmentRepository.findByDoctor_UserId(currentUserId).stream()
            .filter(a -> a.getPatient() != null)
            .collect(Collectors.groupingBy(a -> a.getPatient()));

        List<MyPatientResponse> result = appointments.entrySet().stream().map(entry -> {
            var patient = entry.getKey();
            var patientAppointments = entry.getValue();

            LocalDateTime lastVisit = patientAppointments.stream()
                .filter(a -> AppointmentStatus.COMPLETED == a.getStatus() && a.getCreatedAt() != null)
                .map(a -> a.getCreatedAt().toLocalDateTime())
                .max(LocalDateTime::compareTo)
                .orElse(null);

            LocalDateTime upcoming = patientAppointments.stream()
                .filter(a -> AppointmentStatus.BOOKED == a.getStatus() && a.getSlot() != null && a.getSlot().getStartTime() != null)
                .map(a -> a.getSlot().getStartTime().toLocalDateTime())
                .min(LocalDateTime::compareTo)
                .orElse(null);

            var user = userRepository.findById(patient.getUserId()).orElse(null);
            String name = user != null ? user.getFirstName() + " " + user.getLastName() : "Patient " + patient.getId();
            String phone = user != null ? user.getPhoneNumber() : "N/A";

            return MyPatientResponse.builder()
                .id(patient.getId())
                .patientId(patient.getUserId())
                .name(name)
                .phone(phone)
                .bloodGroup(patient.getBloodGroup())
                .gender(patient.getGender())
                .age(patient.getDateOfBirth() != null ? java.time.LocalDate.now().getYear() - patient.getDateOfBirth().getYear() : null)
                .lastVisitDate(lastVisit)
                .upcomingAppointmentDate(upcoming)
                .status(upcoming != null || lastVisit != null ? "Active" : "Inactive")
                .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{patientId}")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<com.healthcare.clinic.doctor.dto.PatientDetailResponse> getPatientDetail(@PathVariable Long patientId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        var patient = patientProfileRepository.findByUserId(patientId)
            .orElseThrow(() -> new com.healthcare.clinic.exception.ResourceNotFoundException("Patient not found"));

        var user = userRepository.findById(patient.getUserId()).orElse(null);
        String name = user != null ? user.getFirstName() + " " + user.getLastName() : "Patient " + patient.getId();
        String phone = user != null ? user.getPhoneNumber() : "N/A";
        String email = user != null ? user.getEmail() : "N/A";
        int age = patient.getDateOfBirth() != null ? java.time.LocalDate.now().getYear() - patient.getDateOfBirth().getYear() : 0;

        var history = appointmentRepository.findByDoctor_UserId(currentUserId).stream()
            .filter(a -> a.getPatient() != null && patient.getId().equals(a.getPatient().getId()))
            .sorted(java.util.Comparator.comparing(a -> a.getCreatedAt() != null ? a.getCreatedAt().toLocalDateTime() : LocalDateTime.MIN, java.util.Comparator.reverseOrder()))
            .map(a -> com.healthcare.clinic.doctor.dto.PatientDetailResponse.AppointmentHistoryDto.builder()
                .appointmentId(a.getId())
                .date(a.getSlot() != null && a.getSlot().getStartTime() != null ? a.getSlot().getStartTime().toString() : "N/A")
                .reason(a.getReasonForVisit())
                .status(a.getStatus() != null ? a.getStatus().name() : "N/A")
                .notes(a.getNotes())
                .build())
            .collect(Collectors.toList());
            
        // Security check for IDOR: Prevent doctor from viewing PII/PHI of unassociated patients
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        if (history.isEmpty() && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to view this patient's medical records.");
        }

        var prescriptions = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
            .map(p -> {
                String doctorName = p.getDoctorId() != null ? userRepository.findById(p.getDoctorId()).map(u -> "Dr. " + u.getFirstName() + " " + u.getLastName()).orElse("Doctor") : "Doctor";
                int count = p.getItems() != null ? p.getItems().size() : 0;
                String summary = p.getItems() != null && !p.getItems().isEmpty() ? p.getItems().get(0).getMedicationName() + (count > 1 ? " + " + (count - 1) + " more" : "") : "No items";
                return com.healthcare.clinic.doctor.dto.PatientDetailResponse.PreviousPrescriptionDto.builder()
                    .id(p.getId())
                    .date(p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate().toString() : "N/A")
                    .doctorName(doctorName)
                    .itemCount(count)
                    .summary(summary)
                    .build();
            })
            .collect(Collectors.toList());

        var response = com.healthcare.clinic.doctor.dto.PatientDetailResponse.builder()
            .patientId(patient.getUserId())
            .profileId(patient.getId())
            .name(name)
            .phone(phone)
            .email(email)
            .age(age)
            .dateOfBirth(patient.getDateOfBirth())
            .gender(patient.getGender())
            .bloodGroup(patient.getBloodGroup())
            .emergencyContactName(patient.getEmergencyContactName())
            .emergencyContactPhone(patient.getEmergencyContactPhone())
            .allergies(patient.getAllergies())
            .chronicConditions(patient.getChronicConditions())
            .medicalHistorySummary(patient.getMedicalHistorySummary())
            .pastSurgeries(patient.getPastSurgeries())
            .familyHistory(patient.getFamilyHistory())
            .currentMedications(patient.getCurrentMedications())
            .vitalsHistory(java.util.List.of()) // Pending schema addition
            .appointmentHistory(history)
            .previousPrescriptions(prescriptions)
            .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{patientId}/documents")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<com.healthcare.clinic.patient.entity.PatientDocument>> getPatientDocuments(@PathVariable Long patientId) {
        // Here patientId from path is the userId of the patient based on PatientDetail.jsx
        var patient = patientProfileRepository.findByUserId(patientId)
            .orElseThrow(() -> new com.healthcare.clinic.exception.ResourceNotFoundException("Patient not found"));

        return ResponseEntity.ok(patientDocumentRepository.findByPatientIdOrderByUploadedAtDesc(patient.getId()));
    }
}
