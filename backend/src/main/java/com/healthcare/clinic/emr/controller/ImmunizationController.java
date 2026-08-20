package com.healthcare.clinic.emr.controller;

import com.healthcare.clinic.emr.entity.Immunization;
import com.healthcare.clinic.emr.repository.ImmunizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/emr/immunizations")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class ImmunizationController {

    private final ImmunizationRepository repository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Immunization>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(repository.findByPatientId(patientId));
    }

    @PostMapping
    public ResponseEntity<Immunization> create(@RequestBody Immunization entity) {
        return ResponseEntity.ok(repository.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Immunization> update(@PathVariable Long id, @RequestBody Immunization entity) {
        entity.setId(id);
        return ResponseEntity.ok(repository.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

