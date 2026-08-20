package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.PatientInsuranceClaim;
import com.healthcare.clinic.patient.service.PatientInsuranceClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patient/insurance")
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class PatientInsuranceClaimController {

    private final PatientInsuranceClaimService insuranceClaimService;

    @GetMapping
    public ResponseEntity<List<PatientInsuranceClaim>> getClaims(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(insuranceClaimService.getClaims(user));
    }

    @PostMapping
    public ResponseEntity<PatientInsuranceClaim> submitClaim(
            @AuthenticationPrincipal User user,
            @RequestBody PatientInsuranceClaim claim) {
        return ResponseEntity.ok(insuranceClaimService.submitClaim(user, claim));
    }
}
