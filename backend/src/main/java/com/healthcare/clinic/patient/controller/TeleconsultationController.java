package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.TeleconsultationRequest;
import com.healthcare.clinic.patient.service.TeleconsultationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patient/teleconsultations")
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class TeleconsultationController {

    private final TeleconsultationService teleconsultationService;

    @PostMapping
    public ResponseEntity<TeleconsultationRequest> requestTeleconsultation(
            @AuthenticationPrincipal User user,
            @RequestBody TeleconsultationRequest request) {
        return ResponseEntity.ok(teleconsultationService.requestTeleconsultation(user, request));
    }

    @GetMapping
    public ResponseEntity<List<TeleconsultationRequest>> getPatientRequests(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(teleconsultationService.getPatientRequests(user));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<TeleconsultationRequest> cancelRequest(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(teleconsultationService.cancelRequest(user, id));
    }
}
