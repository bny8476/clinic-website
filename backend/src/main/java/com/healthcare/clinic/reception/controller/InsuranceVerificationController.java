package com.healthcare.clinic.reception.controller;

import com.healthcare.clinic.reception.entity.InsuranceVerification;
import com.healthcare.clinic.reception.service.InsuranceVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reception/insurance")
@RequiredArgsConstructor
public class InsuranceVerificationController {

    private final InsuranceVerificationService insuranceVerificationService;

    @PostMapping("/request")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<InsuranceVerification> requestVerification(@RequestBody Map<String, Object> request) {
        Long patientId = Long.valueOf(request.get("patientId").toString());
        String provider = (String) request.get("insuranceProvider");
        String policyNumber = (String) request.get("policyNumber");

        InsuranceVerification verification = insuranceVerificationService.requestVerification(patientId, provider, policyNumber);
        return ResponseEntity.ok(verification);
    }

    @PutMapping("/{verificationId}/verify")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<InsuranceVerification> verifyInsurance(
            @PathVariable Long verificationId,
            @RequestBody Map<String, Object> request) {
        
        String status = (String) request.get("status");
        String coverageDetails = (String) request.get("coverageDetails");

        InsuranceVerification verification = insuranceVerificationService.verifyInsurance(verificationId, status, coverageDetails);
        return ResponseEntity.ok(verification);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<List<InsuranceVerification>> getPatientVerifications(@PathVariable Long patientId) {
        return ResponseEntity.ok(insuranceVerificationService.getPatientVerifications(patientId));
    }
}
