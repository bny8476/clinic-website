package com.healthcare.clinic.reception.controller;

import com.healthcare.clinic.reception.service.ReceptionPatientService;
import com.healthcare.clinic.reception.dto.IdentityVerificationRequest;
import com.healthcare.clinic.reception.dto.IdentityVerificationResponse;
import com.healthcare.clinic.reception.service.IdentityVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reception")
@RequiredArgsConstructor
public class ReceptionPatientController {

    private final ReceptionPatientService patientService;
    private final IdentityVerificationService identityVerificationService;

    @GetMapping("/patients/search")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> searchPatients(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String opNumber) {
        return ResponseEntity.ok(patientService.searchPatients(query, opNumber));
    }

    @PostMapping("/patients/{patientId}/verify-identity")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<IdentityVerificationResponse> verifyIdentity(
            @PathVariable Long patientId,
            @RequestBody IdentityVerificationRequest request) {
        request.setPatientId(patientId);
        return ResponseEntity.ok(identityVerificationService.verifyIdentity(request));
    }

    @PostMapping("/patients/register")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DOCTOR')")
    public ResponseEntity<Map<String, Object>> registerPatient(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(patientService.registerPatient(request));
    }

    @GetMapping("/patients/{patientId}/identity-verifications")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<IdentityVerificationResponse>> getVerifications(@PathVariable Long patientId) {
        return ResponseEntity.ok(identityVerificationService.getVerificationsForPatient(patientId));
    }
}
