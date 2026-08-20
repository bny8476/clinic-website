package com.healthcare.clinic.doctor.controller;

import com.healthcare.clinic.doctor.entity.ClinicalEncounter;
import com.healthcare.clinic.doctor.service.ClinicalEncounterService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.healthcare.clinic.audit.annotation.AuditableAction;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doctor/encounters")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class ClinicalEncounterController {

    private final ClinicalEncounterService encounterService;

    @GetMapping
    public ResponseEntity<List<ClinicalEncounter>> getMyEncounters(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(encounterService.getMyEncounters(user.getUserId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClinicalEncounter> getEncounter(@AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        return ResponseEntity.ok(encounterService.getEncounter(user.getUserId(), id));
    }

    @PostMapping
    @AuditableAction(module = "CLINICAL_ENCOUNTER", action = "OPEN", resourceType = "ClinicalEncounter", sensitivityLevel = "HIGH")
    public ResponseEntity<ClinicalEncounter> startEncounter(@AuthenticationPrincipal UserPrincipal user, @RequestBody ClinicalEncounter encounter) {
        return ResponseEntity.ok(encounterService.startEncounter(user.getUserId(), encounter));
    }

    @PostMapping("/{id}/close")
    @AuditableAction(module = "CLINICAL_ENCOUNTER", action = "CLOSE", resourceType = "ClinicalEncounter", sensitivityLevel = "HIGH")
    public ResponseEntity<ClinicalEncounter> closeEncounter(@AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        return ResponseEntity.ok(encounterService.closeEncounter(user.getUserId(), id));
    }
}
