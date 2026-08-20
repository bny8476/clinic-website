package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.PatientNotification;
import com.healthcare.clinic.patient.service.PatientNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patient/notifications")
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class PatientNotificationController {

    private final PatientNotificationService patientNotificationService;

    @GetMapping
    public ResponseEntity<List<PatientNotification>> getNotifications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(patientNotificationService.getNotifications(user));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<PatientNotification>> getUnreadNotifications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(patientNotificationService.getUnreadNotifications(user));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        patientNotificationService.markAsRead(user, id);
        return ResponseEntity.ok().build();
    }
}
