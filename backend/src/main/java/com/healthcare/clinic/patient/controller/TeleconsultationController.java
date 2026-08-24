package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.patient.entity.TeleconsultationRequest;
import com.healthcare.clinic.patient.service.TeleconsultationService;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/patient/teleconsultations")
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_ADMIN')")
@RequiredArgsConstructor
public class TeleconsultationController {

    private final TeleconsultationService teleconsultationService;

    @PostMapping
    public ResponseEntity<TeleconsultationRequest> requestTeleconsultation(
            @RequestBody TeleconsultationRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(teleconsultationService.requestTeleconsultationForUserId(currentUserId, request));
    }

    @GetMapping
    public ResponseEntity<List<TeleconsultationRequest>> getPatientRequests() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) return ResponseEntity.ok(Collections.emptyList());
        return ResponseEntity.ok(teleconsultationService.getPatientRequestsForUserId(currentUserId));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<TeleconsultationRequest> cancelRequest(@PathVariable Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(teleconsultationService.cancelRequestForUserId(currentUserId, id));
    }
}
