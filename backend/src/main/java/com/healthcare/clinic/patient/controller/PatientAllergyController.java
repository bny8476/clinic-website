package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.PatientAllergy;
import com.healthcare.clinic.patient.service.PatientAllergyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doctor/patients/{patientId}/allergies")
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class PatientAllergyController {

    private final PatientAllergyService allergyService;

    @GetMapping
    public ResponseEntity<List<PatientAllergy>> getAllergies(@PathVariable Long patientId) {
        return ResponseEntity.ok(allergyService.getActiveAllergies(patientId));
    }

    @PostMapping
    public ResponseEntity<PatientAllergy> addAllergy(
            @AuthenticationPrincipal User user,
            @PathVariable Long patientId,
            @RequestBody PatientAllergy allergy) {
        allergy.setPatientId(patientId);
        return ResponseEntity.ok(allergyService.addAllergy(user, allergy));
    }

    @PostMapping("/{allergyId}/verify")
    public ResponseEntity<PatientAllergy> verifyAllergy(@PathVariable Long allergyId) {
        return ResponseEntity.ok(allergyService.verifyAllergy(allergyId));
    }

    @PostMapping("/{allergyId}/error")
    public ResponseEntity<PatientAllergy> markAsError(@PathVariable Long allergyId) {
        return ResponseEntity.ok(allergyService.markAsError(allergyId));
    }
}
