package com.healthcare.clinic.emr.controller;

import com.healthcare.clinic.emr.entity.FamilyHistoryEntry;
import com.healthcare.clinic.emr.repository.FamilyHistoryEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/emr/familyhistoryentrys")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class FamilyHistoryEntryController {

    private final FamilyHistoryEntryRepository repository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<FamilyHistoryEntry>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(repository.findByPatientId(patientId));
    }

    @PostMapping
    public ResponseEntity<FamilyHistoryEntry> create(@RequestBody FamilyHistoryEntry entity) {
        return ResponseEntity.ok(repository.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FamilyHistoryEntry> update(@PathVariable Long id, @RequestBody FamilyHistoryEntry entity) {
        entity.setId(id);
        return ResponseEntity.ok(repository.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

