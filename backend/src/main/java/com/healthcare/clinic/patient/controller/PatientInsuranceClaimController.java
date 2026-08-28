package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.patient.entity.PatientInsuranceClaim;
import com.healthcare.clinic.patient.service.PatientInsuranceClaimService;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patient/insurance-claims")
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class PatientInsuranceClaimController {

    private final PatientInsuranceClaimService insuranceClaimService;

    @GetMapping
    public ResponseEntity<List<PatientInsuranceClaim>> getClaims() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(insuranceClaimService.getClaims(userId));
    }

    @PostMapping
    public ResponseEntity<PatientInsuranceClaim> submitClaim(@RequestBody PatientInsuranceClaim claim) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(insuranceClaimService.submitClaim(userId, claim));
    }
}
