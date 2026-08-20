package com.healthcare.clinic.emr.controller;

import com.healthcare.clinic.emr.entity.ProcedureRecord;
import com.healthcare.clinic.emr.repository.ProcedureRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/emr/procedurerecords")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class ProcedureRecordController {

    private final ProcedureRecordRepository repository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ProcedureRecord>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(repository.findByPatientId(patientId));
    }

    @PostMapping
    public ResponseEntity<ProcedureRecord> create(@RequestBody ProcedureRecord entity) {
        return ResponseEntity.ok(repository.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProcedureRecord> update(@PathVariable Long id, @RequestBody ProcedureRecord entity) {
        entity.setId(id);
        return ResponseEntity.ok(repository.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

