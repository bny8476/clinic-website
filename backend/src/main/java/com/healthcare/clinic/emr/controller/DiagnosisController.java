package com.healthcare.clinic.emr.controller;

import com.healthcare.clinic.emr.entity.Diagnosis;
import com.healthcare.clinic.emr.service.DiagnosisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/emr/diagnosiss")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class DiagnosisController {

    private final DiagnosisService service;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Diagnosis>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(service.getDiagnosesByPatient(patientId));
    }

    @PostMapping
    public ResponseEntity<Diagnosis> create(@RequestBody Diagnosis entity) {
        return ResponseEntity.ok(service.addDiagnosis(entity));
    }

    // Usually we shouldn't update diagnoses that easily, but we'll leave it simple for now
}
