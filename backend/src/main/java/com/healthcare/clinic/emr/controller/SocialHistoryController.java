package com.healthcare.clinic.emr.controller;

import com.healthcare.clinic.emr.entity.SocialHistory;
import com.healthcare.clinic.emr.repository.SocialHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/emr/socialhistorys")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class SocialHistoryController {

    private final SocialHistoryRepository repository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<SocialHistory>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(repository.findByPatientId(patientId));
    }

    @PostMapping
    public ResponseEntity<SocialHistory> create(@RequestBody SocialHistory entity) {
        return ResponseEntity.ok(repository.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SocialHistory> update(@PathVariable Long id, @RequestBody SocialHistory entity) {
        entity.setId(id);
        return ResponseEntity.ok(repository.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

