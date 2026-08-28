package com.healthcare.clinic.insurance.controller;

import com.healthcare.clinic.insurance.entity.InsurancePreAuth;
import com.healthcare.clinic.insurance.repository.InsurancePreAuthRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping({"/api/v1/patient/insurance", "/api/patient/insurance"})
@RequiredArgsConstructor
public class PatientInsuranceController {

    private final InsurancePreAuthRepository insurancePreAuthRepository;
    private final PatientProfileRepository patientProfileRepository;

    @GetMapping({"", "/pre-auths"})
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<List<InsurancePreAuth>> getMyPreAuths() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(401).build();
        }
        
        Optional<PatientProfile> patientOpt = patientProfileRepository.findByUserId(currentUserId);
        if (patientOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        
        Long patientId = patientOpt.get().getId();
        List<InsurancePreAuth> preAuths = insurancePreAuthRepository.findByPatientId(patientId);
        
        return ResponseEntity.ok(preAuths);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<?> createPreAuth(@RequestBody CreateInsuranceClaimRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(401).build();
        }

        Optional<PatientProfile> patientOpt = patientProfileRepository.findByUserId(currentUserId);
        if (patientOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Patient profile not found");
        }

        Long patientId = patientOpt.get().getId();

        InsurancePreAuth preAuth = InsurancePreAuth.builder()
                .patientId(patientId)
                .providerName(request.getProvider() != null ? request.getProvider() : "General Insurance")
                .policyNumber(request.getPolicyNumber())
                .procedureName(request.getNotes() != null ? request.getNotes() : "Medical Pre-Authorization Claim")
                .estimatedCost(request.getClaimAmount() != null ? request.getClaimAmount() : BigDecimal.ZERO)
                .status("SUBMITTED")
                .build();

        InsurancePreAuth saved = insurancePreAuthRepository.save(preAuth);
        return ResponseEntity.ok(saved);
    }
}

@Data
class CreateInsuranceClaimRequest {
    private String provider;
    private String policyNumber;
    private BigDecimal claimAmount;
    private String notes;
}
