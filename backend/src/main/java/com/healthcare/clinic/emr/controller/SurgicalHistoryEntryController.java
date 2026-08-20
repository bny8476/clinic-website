package com.healthcare.clinic.emr.controller;

import com.healthcare.clinic.emr.entity.SurgicalHistoryEntry;
import com.healthcare.clinic.emr.repository.SurgicalHistoryEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/emr/surgicalhistoryentrys")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class SurgicalHistoryEntryController {

    private final SurgicalHistoryEntryRepository repository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<SurgicalHistoryEntry>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(repository.findByPatientId(patientId));
    }

    @PostMapping
    public ResponseEntity<SurgicalHistoryEntry> create(@RequestBody SurgicalHistoryEntry entity) {
        return ResponseEntity.ok(repository.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SurgicalHistoryEntry> update(@PathVariable Long id, @RequestBody SurgicalHistoryEntry entity) {
        entity.setId(id);
        return ResponseEntity.ok(repository.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

