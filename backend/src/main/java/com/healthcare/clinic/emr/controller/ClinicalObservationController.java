package com.healthcare.clinic.emr.controller;

import com.healthcare.clinic.emr.entity.ClinicalObservation;
import com.healthcare.clinic.emr.repository.ClinicalObservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/emr/clinicalobservations")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class ClinicalObservationController {

    private final ClinicalObservationRepository repository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ClinicalObservation>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(repository.findByPatientId(patientId));
    }

    @PostMapping
    public ResponseEntity<ClinicalObservation> create(@RequestBody ClinicalObservation entity) {
        return ResponseEntity.ok(repository.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClinicalObservation> update(@PathVariable Long id, @RequestBody ClinicalObservation entity) {
        entity.setId(id);
        return ResponseEntity.ok(repository.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

