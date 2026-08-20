package com.healthcare.clinic.emr.controller;

import com.healthcare.clinic.emr.entity.Problem;
import com.healthcare.clinic.emr.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/emr/problems")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemRepository repository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Problem>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(repository.findByPatientId(patientId));
    }

    @PostMapping
    public ResponseEntity<Problem> create(@RequestBody Problem entity) {
        return ResponseEntity.ok(repository.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Problem> update(@PathVariable Long id, @RequestBody Problem entity) {
        entity.setId(id);
        return ResponseEntity.ok(repository.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

