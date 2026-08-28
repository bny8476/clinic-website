package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.patient.entity.*;
import com.healthcare.clinic.patient.service.PatientSettingsService;
import com.healthcare.clinic.security.SecurityUtils;
import com.healthcare.clinic.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patient/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PATIENT') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
public class PatientSettingsController {

    private final PatientSettingsService patientSettingsService;

    private Long getRequiredUserId(UserPrincipal principal) {
        if (principal != null && principal.getUserId() != null) {
            return principal.getUserId();
        }
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null) {
            return currentUserId;
        }
        throw new IllegalStateException("User is not authenticated");
    }

    // --- Dependents ---
    @GetMapping("/dependents")
    public ResponseEntity<List<DependentProfile>> getDependents(@AuthenticationPrincipal UserPrincipal principal) {
        Long userId = getRequiredUserId(principal);
        return ResponseEntity.ok(patientSettingsService.getDependents(userId));
    }

    @PostMapping("/dependents")
    public ResponseEntity<DependentProfile> addDependent(@AuthenticationPrincipal UserPrincipal principal, @RequestBody DependentProfile dependent) {
        Long userId = getRequiredUserId(principal);
        return ResponseEntity.ok(patientSettingsService.addDependent(userId, dependent));
    }

    @DeleteMapping("/dependents/{id}")
    public ResponseEntity<Void> removeDependent(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        Long userId = getRequiredUserId(principal);
        patientSettingsService.removeDependent(userId, id);
        return ResponseEntity.noContent().build();
    }

    // --- Emergency Contacts ---
    @GetMapping("/emergency-contacts")
    public ResponseEntity<List<EmergencyContact>> getEmergencyContacts(@AuthenticationPrincipal UserPrincipal principal) {
        Long userId = getRequiredUserId(principal);
        return ResponseEntity.ok(patientSettingsService.getEmergencyContacts(userId));
    }

    @PostMapping("/emergency-contacts")
    public ResponseEntity<EmergencyContact> addEmergencyContact(@AuthenticationPrincipal UserPrincipal principal, @RequestBody EmergencyContact contact) {
        Long userId = getRequiredUserId(principal);
        return ResponseEntity.ok(patientSettingsService.addEmergencyContact(userId, contact));
    }

    @DeleteMapping("/emergency-contacts/{id}")
    public ResponseEntity<Void> removeEmergencyContact(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        Long userId = getRequiredUserId(principal);
        patientSettingsService.removeEmergencyContact(userId, id);
        return ResponseEntity.noContent().build();
    }

    // --- Notification Preferences ---
    @GetMapping("/notifications")
    public ResponseEntity<List<PatientNotificationPreference>> getNotificationPreferences(@AuthenticationPrincipal UserPrincipal principal) {
        Long userId = getRequiredUserId(principal);
        return ResponseEntity.ok(patientSettingsService.getNotificationPreferences(userId));
    }

    @PutMapping("/notifications/{category}")
    public ResponseEntity<PatientNotificationPreference> updateNotificationPreference(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String category,
            @RequestBody PatientNotificationPreference pref) {
        Long userId = getRequiredUserId(principal);
        return ResponseEntity.ok(patientSettingsService.updateNotificationPreference(userId, category, pref));
    }

    // --- Consents ---
    @GetMapping("/consents/versions")
    public ResponseEntity<List<ConsentVersion>> getLatestConsentVersions() {
        return ResponseEntity.ok(patientSettingsService.getLatestConsentVersions());
    }

    @GetMapping("/consents")
    public ResponseEntity<List<PatientConsent>> getPatientConsents(@AuthenticationPrincipal UserPrincipal principal) {
        Long userId = getRequiredUserId(principal);
        return ResponseEntity.ok(patientSettingsService.getPatientConsents(userId));
    }

    @PostMapping("/consents/{consentType}")
    public ResponseEntity<PatientConsent> grantConsent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String consentType,
            HttpServletRequest request) {
        Long userId = getRequiredUserId(principal);
        String ipAddress = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        return ResponseEntity.ok(patientSettingsService.grantConsent(userId, consentType, ipAddress, userAgent));
    }

    @DeleteMapping("/consents/{consentType}")
    public ResponseEntity<Void> revokeConsent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String consentType) {
        Long userId = getRequiredUserId(principal);
        patientSettingsService.revokeConsent(userId, consentType);
        return ResponseEntity.noContent().build();
    }
}
