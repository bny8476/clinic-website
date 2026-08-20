package com.healthcare.clinic.emr.controller;

import com.healthcare.clinic.emr.entity.ClinicalReferral;
import com.healthcare.clinic.emr.repository.ClinicalReferralRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController("emrClinicalReferralController")
@RequestMapping("/api/emr/clinicalreferrals")
@RequiredArgsConstructor
public class ClinicalReferralController {

    private final ClinicalReferralRepository repository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ClinicalReferral>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(repository.findByPatientId(patientId));
    }

    @PostMapping
    public ResponseEntity<ClinicalReferral> create(@RequestBody ClinicalReferral entity) {
        return ResponseEntity.ok(repository.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClinicalReferral> update(@PathVariable Long id, @RequestBody ClinicalReferral entity) {
        entity.setId(id);
        return ResponseEntity.ok(repository.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

