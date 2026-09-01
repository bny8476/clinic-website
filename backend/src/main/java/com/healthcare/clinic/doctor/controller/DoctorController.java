package com.healthcare.clinic.doctor.controller;

import com.healthcare.clinic.doctor.dto.DoctorProfileRequest;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.security.SecurityUtils;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorProfileRepository doctorRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<com.healthcare.clinic.doctor.dto.DoctorProfileWithNameDto>> getActiveDoctors() {
        // Publicly accessible for the marketing site
        return ResponseEntity.ok(doctorRepository.findActiveDoctorsWithNames());
    }


    @GetMapping("/{userId}/full-profile")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> getDoctorFullProfile(@PathVariable Long userId) {
        com.healthcare.clinic.security.SecurityUtils.assertOwnerOrAdmin(userId);
        
        return doctorRepository.findByUserId(userId).map(profile -> {
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("specialty", profile.getSpecialty());
            response.put("qualifications", profile.getQualifications());
            response.put("registrationNumber", profile.getRegistrationNumber());
            
            userRepository.findById(userId).ifPresent(u -> {
                response.put("doctorName", u.getFirstName() + " " + u.getLastName());
            });
            
            if (profile.getBranchId() != null) {
                branchRepository.findById(profile.getBranchId()).ifPresent(b -> {
                    response.put("clinicName", b.getName());
                    response.put("clinicAddress", b.getAddress());
                    response.put("clinicPhone", b.getPhoneNumber());
                    response.put("clinicEmail", b.getEmail());
                });
            }
            
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    @com.healthcare.clinic.audit.annotation.AuditableAction(module = "DOCTOR", action = "LIST", resourceType = "DoctorList", sensitivityLevel = "NORMAL")
    public ResponseEntity<org.springframework.data.domain.Page<java.util.Map<String, Object>>> getAllDoctorsAdmin(
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<DoctorProfile> doctorsPage = doctorRepository.findAll(pageable);
        org.springframework.data.domain.Page<java.util.Map<String, Object>> dtoPage = doctorsPage.map(d -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            com.healthcare.clinic.identity.entity.User u = d.getUserId() != null ? 
                userRepository.findById(d.getUserId()).orElse(null) : null;
            map.put("id", d.getId());
            map.put("userId", d.getUserId());
            map.put("firstName", u != null && u.getFirstName() != null ? u.getFirstName() : "");
            map.put("lastName", u != null && u.getLastName() != null ? u.getLastName() : "");
            map.put("email", u != null && u.getEmail() != null ? u.getEmail() : "");
            map.put("phone", u != null && u.getPhoneNumber() != null ? u.getPhoneNumber() : "");
            map.put("specialty", d.getSpecialty());
            map.put("qualifications", d.getQualifications());
            map.put("registrationNumber", d.getRegistrationNumber());
            map.put("isActive", d.getIsActive());
            return map;
        });
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<DoctorProfile> getDoctorProfile(@PathVariable Long userId) {
        com.healthcare.clinic.security.SecurityUtils.assertOwnerOrAdmin(userId);
        return doctorRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/profile")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<DoctorProfile> createOrUpdateProfile(@jakarta.validation.Valid @RequestBody DoctorProfileRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Optional<DoctorProfile> existing = doctorRepository.findByUserId(currentUserId);
        
        DoctorProfile profile = existing.orElse(new DoctorProfile());
        profile.setUserId(currentUserId);
        profile.setSpecialty(request.getSpecialty());
        profile.setQualifications(request.getQualifications());
        profile.setExperienceYears(request.getExperienceYears());
        profile.setConsultationFee(request.getConsultationFee());
        profile.setBio(request.getBio());
        profile.setIsActive(request.getIsActive() != null ? request.getIsActive() : (profile.getIsActive() != null ? profile.getIsActive() : true));
        profile.setBranchId(request.getBranchId() != null ? request.getBranchId() : (profile.getBranchId() != null ? profile.getBranchId() : 1L));
        
        DoctorProfile saved = doctorRepository.save(profile);
        return ResponseEntity.ok(saved);
    }
}
