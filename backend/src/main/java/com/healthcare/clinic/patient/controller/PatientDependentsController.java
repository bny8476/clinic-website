package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.patient.entity.DependentProfile;
import com.healthcare.clinic.patient.service.PatientSettingsService;
import com.healthcare.clinic.security.SecurityUtils;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Short-path alias for the dependents API: /api/v1/patient/dependents.
 * The canonical endpoints live in PatientSettingsController (/api/v1/patient/settings/dependents);
 * this alias delegates to the same service so clients using either path work.
 */
@RestController
@RequestMapping({"/api/v1/patient/dependents", "/api/patient/dependents"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('PATIENT') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
public class PatientDependentsController {

    private final PatientSettingsService patientSettingsService;

    private Long requiredUserId(UserPrincipal principal) {
        if (principal != null && principal.getUserId() != null) {
            return principal.getUserId();
        }
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null) {
            return currentUserId;
        }
        throw new IllegalStateException("User is not authenticated");
    }

    @GetMapping
    public ResponseEntity<List<DependentProfile>> getDependents(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(patientSettingsService.getDependents(requiredUserId(principal)));
    }

    @PostMapping
    public ResponseEntity<DependentProfile> addDependent(@AuthenticationPrincipal UserPrincipal principal,
                                                         @RequestBody DependentProfile dependent) {
        return ResponseEntity.ok(patientSettingsService.addDependent(requiredUserId(principal), dependent));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeDependent(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        patientSettingsService.removeDependent(requiredUserId(principal), id);
        return ResponseEntity.noContent().build();
    }
}
