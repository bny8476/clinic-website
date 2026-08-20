package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.PatientPortalPayment;
import com.healthcare.clinic.patient.service.PatientPortalPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patient/payments")
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class PatientPortalPaymentController {

    private final PatientPortalPaymentService patientPaymentService;

    @GetMapping
    public ResponseEntity<List<PatientPortalPayment>> getPayments(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(patientPaymentService.getPayments(user));
    }

    @PostMapping
    public ResponseEntity<PatientPortalPayment> processPayment(
            @AuthenticationPrincipal User user,
            @RequestBody PatientPortalPayment payment) {
        return ResponseEntity.ok(patientPaymentService.processPayment(user, payment));
    }
}
