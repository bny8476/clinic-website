package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.audit.annotation.AuditableAction;
import com.healthcare.clinic.patient.dto.PatientProfileRequest;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.SecurityUtils;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientProfileRepository patientRepository;
    private final com.healthcare.clinic.patient.repository.VitalsRepository vitalsRepository;
    private final com.healthcare.clinic.identity.repository.UserRepository userRepository;
    private final com.healthcare.clinic.patient.service.Patient360Service patient360Service;

    @GetMapping("/profile/{userId}")
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    @AuditableAction(module = "PATIENT", action = "VIEW", resourceType = "PatientProfile", sensitivityLevel = "NORMAL")
    public ResponseEntity<PatientProfile> getPatientProfile(@PathVariable Long userId) {
        com.healthcare.clinic.security.SecurityUtils.assertOwnerOrAdmin(userId);
        return patientRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/{patientId}")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_PATIENT')")
    @AuditableAction(module = "PATIENT", action = "VIEW", resourceType = "PatientProfile", sensitivityLevel = "NORMAL")
    public ResponseEntity<PatientProfile> getPatientById(@PathVariable Long patientId) {
        Optional<PatientProfile> profile = patientRepository.findById(patientId);
        if (profile.isEmpty()) {
            profile = patientRepository.findByUserId(patientId);
        }
        return profile.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{patientId}/360")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<com.healthcare.clinic.patient.dto.Patient360DTO> getPatient360(@PathVariable Long patientId) {
        return ResponseEntity.ok(patient360Service.getPatient360(patientId));
    }

    @PostMapping("/profile")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    @AuditableAction(module = "PATIENT", action = "EDIT", resourceType = "PatientProfile", sensitivityLevel = "NORMAL")
    public ResponseEntity<PatientProfile> createOrUpdateProfile(@jakarta.validation.Valid @RequestBody PatientProfileRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Optional<PatientProfile> existing = patientRepository.findByUserId(currentUserId);
        
        PatientProfile profile = existing.orElse(new PatientProfile());
        profile.setUserId(currentUserId);
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setBloodGroup(request.getBloodGroup());
        profile.setEmergencyContactName(request.getEmergencyContactName());
        profile.setEmergencyContactPhone(request.getEmergencyContactPhone());
        profile.setAddress(request.getAddress());
        profile.setMedicalHistorySummary(request.getMedicalHistorySummary());
        if (request.getInsuranceStatus() != null) profile.setInsuranceStatus(request.getInsuranceStatus());
        if (request.getInjuryStatus() != null) profile.setInjuryStatus(request.getInjuryStatus());
        profile.setBranchId(request.getBranchId() != null ? request.getBranchId() : (profile.getBranchId() != null ? profile.getBranchId() : 1L));
        
        PatientProfile saved = patientRepository.save(profile);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<java.util.List<PatientProfile>> getMyPatients() {
        return ResponseEntity.ok(java.util.List.of());
    }

    @PutMapping("/{patientId}")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    @AuditableAction(module = "PATIENT", action = "EDIT", resourceType = "PatientProfile", sensitivityLevel = "HIGH")
    public ResponseEntity<PatientProfile> updatePatientByDoctor(
            @PathVariable Long patientId,
            @RequestBody PatientProfileRequest request) {
        
        Optional<PatientProfile> existing = patientRepository.findById(patientId);
        if (existing.isEmpty()) {
            existing = patientRepository.findByUserId(patientId);
        }
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        PatientProfile profile = existing.get();
        if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) profile.setGender(request.getGender());
        if (request.getBloodGroup() != null) profile.setBloodGroup(request.getBloodGroup());
        if (request.getEmergencyContactName() != null) profile.setEmergencyContactName(request.getEmergencyContactName());
        if (request.getEmergencyContactPhone() != null) profile.setEmergencyContactPhone(request.getEmergencyContactPhone());
        if (request.getAddress() != null) profile.setAddress(request.getAddress());
        if (request.getMedicalHistorySummary() != null) profile.setMedicalHistorySummary(request.getMedicalHistorySummary());
        if (request.getAllergies() != null) profile.setAllergies(request.getAllergies());
        if (request.getInsuranceStatus() != null) profile.setInsuranceStatus(request.getInsuranceStatus());
        if (request.getInjuryStatus() != null) profile.setInjuryStatus(request.getInjuryStatus());
        
        PatientProfile saved = patientRepository.save(profile);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    @AuditableAction(module = "PATIENT", action = "SEARCH", resourceType = "PatientList", sensitivityLevel = "NORMAL")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> searchPatients(@RequestParam(required = false) String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(java.util.List.of());
        }
        
        org.springframework.data.domain.Page<com.healthcare.clinic.identity.entity.User> users = userRepository.searchByNameOrEmail(query, org.springframework.data.domain.PageRequest.of(0, 20));
        java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        
        for (com.healthcare.clinic.identity.entity.User u : users.getContent()) {
            if (u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_PATIENT"))) {
                patientRepository.findByUserId(u.getId()).ifPresent(p -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", p.getId());
                    map.put("patientId", p.getUserId());
                    map.put("firstName", u.getFirstName() != null ? u.getFirstName() : "");
                    map.put("lastName", u.getLastName() != null ? u.getLastName() : "");
                    map.put("phone", u.getPhoneNumber() != null ? u.getPhoneNumber() : "");
                    map.put("gender", p.getGender());
                    result.add(map);
                });
            }
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    @AuditableAction(module = "PATIENT", action = "LIST", resourceType = "PatientList", sensitivityLevel = "NORMAL")
    public ResponseEntity<org.springframework.data.domain.Page<java.util.Map<String, Object>>> getAllPatients(
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<PatientProfile> patientsPage = patientRepository.findAll(pageable);
        org.springframework.data.domain.Page<java.util.Map<String, Object>> dtoPage = patientsPage.map(p -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            com.healthcare.clinic.identity.entity.User u = p.getUserId() != null ? 
                userRepository.findById(p.getUserId()).orElse(null) : null;
            map.put("id", p.getId());
            map.put("patientId", p.getUserId());
            map.put("firstName", u != null && u.getFirstName() != null ? u.getFirstName() : "");
            map.put("lastName", u != null && u.getLastName() != null ? u.getLastName() : "");
            map.put("email", u != null && u.getEmail() != null ? u.getEmail() : "");
            map.put("phone", u != null && u.getPhoneNumber() != null ? u.getPhoneNumber() : "");
            map.put("gender", p.getGender());
            map.put("dateOfBirth", p.getDateOfBirth());
            return map;
        });
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/{patientId}/vitals/latest")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_PATIENT')")
    @AuditableAction(module = "PATIENT", action = "VIEW", resourceType = "Vitals", sensitivityLevel = "HIGH")
    public ResponseEntity<com.healthcare.clinic.patient.entity.Vitals> getLatestVitals(@PathVariable Long patientId) {
        Long targetId = patientId;
        Optional<PatientProfile> profile = patientRepository.findById(patientId);
        if (profile.isEmpty()) {
            profile = patientRepository.findByUserId(patientId);
        }
        if (profile.isPresent()) {
            targetId = profile.get().getId();
        }
        
        Optional<com.healthcare.clinic.patient.entity.Vitals> vitals = vitalsRepository.findTopByPatientIdOrderByRecordedAtDesc(targetId);
        if (vitals.isEmpty() && !targetId.equals(patientId)) {
            vitals = vitalsRepository.findTopByPatientIdOrderByRecordedAtDesc(patientId);
        }
        return vitals.map(ResponseEntity::ok).orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/{patientId}/vitals/history")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_PATIENT')")
    @AuditableAction(module = "PATIENT", action = "VIEW", resourceType = "VitalsHistory", sensitivityLevel = "HIGH")
    public ResponseEntity<java.util.List<com.healthcare.clinic.patient.entity.Vitals>> getAllVitals(@PathVariable Long patientId) {
        Long targetId = patientId;
        Optional<PatientProfile> profile = patientRepository.findById(patientId);
        if (profile.isEmpty()) {
            profile = patientRepository.findByUserId(patientId);
        }
        if (profile.isPresent()) {
            targetId = profile.get().getId();
        }
        
        java.util.List<com.healthcare.clinic.patient.entity.Vitals> list = vitalsRepository.findByPatientIdOrderByRecordedAtDesc(targetId);
        if (list.isEmpty() && !targetId.equals(patientId)) {
            list = vitalsRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{patientId}/vitals/record")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    @AuditableAction(module = "PATIENT", action = "CREATE", resourceType = "Vitals", sensitivityLevel = "HIGH")
    public ResponseEntity<com.healthcare.clinic.patient.entity.Vitals> recordVitals(
            @PathVariable Long patientId,
            @RequestBody com.healthcare.clinic.patient.entity.Vitals vitals) {
        
        Optional<PatientProfile> profile = patientRepository.findById(patientId);
        if (profile.isEmpty()) {
            profile = patientRepository.findByUserId(patientId);
        }
        if (profile.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        PatientProfile patient = profile.get();
        
        if (vitals.getHeightCm() != null && (vitals.getHeightCm() <= 0 || vitals.getHeightCm() > 300)) {
            throw new IllegalArgumentException("Height must be between 1 and 300 cm");
        }
        if (vitals.getWeightKg() != null && (vitals.getWeightKg() <= 0 || vitals.getWeightKg() > 500)) {
            throw new IllegalArgumentException("Weight must be between 1 and 500 kg");
        }
        if (vitals.getPulseBpm() != null && (vitals.getPulseBpm() <= 0 || vitals.getPulseBpm() > 300)) {
            throw new IllegalArgumentException("Pulse must be between 1 and 300 bpm");
        }
        if (vitals.getBloodPressure() != null && !vitals.getBloodPressure().trim().isEmpty() && !vitals.getBloodPressure().matches("^\\d{2,3}/\\d{2,3}$")) {
            throw new IllegalArgumentException("Blood pressure must be in format SYS/DIA (e.g. 120/80)");
        }
        
        vitals.setPatient(patient);
        if (vitals.getRecordedAt() == null) {
            vitals.setRecordedAt(java.time.LocalDateTime.now());
        }
        vitals.setDoctorId(SecurityUtils.getCurrentUserId());
        
        com.healthcare.clinic.patient.entity.Vitals saved = vitalsRepository.save(vitals);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{patientId}")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    @AuditableAction(module = "PATIENT", action = "DELETE", resourceType = "PatientProfile", sensitivityLevel = "HIGH")
    public ResponseEntity<Void> deletePatient(@PathVariable Long patientId) {
        Optional<PatientProfile> profile = patientRepository.findById(patientId);
        if (profile.isEmpty()) {
            profile = patientRepository.findByUserId(patientId);
        }
        if (profile.isPresent()) {
            patientRepository.delete(profile.get());
            userRepository.findById(profile.get().getUserId()).ifPresent(userRepository::delete);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
