package com.healthcare.clinic.doctor.controller;

import com.healthcare.clinic.doctor.entity.SoapNote;
import com.healthcare.clinic.doctor.service.SoapNoteService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.healthcare.clinic.audit.annotation.AuditableAction;

@RestController
@RequestMapping("/api/v1/doctor/encounters/{encounterId}/soap-note")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class SoapNoteController {

    private final SoapNoteService soapNoteService;

    @GetMapping
    public ResponseEntity<SoapNote> getSoapNote(@AuthenticationPrincipal UserPrincipal user, @PathVariable Long encounterId) {
        return soapNoteService.getSoapNote(user.getUserId(), encounterId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping
    @AuditableAction(module = "CLINICAL_ENCOUNTER", action = "EDIT_SOAP", resourceType = "SoapNote", sensitivityLevel = "HIGH")
    public ResponseEntity<SoapNote> saveSoapNote(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long encounterId,
            @RequestBody SoapNote soapNote) {
        return ResponseEntity.ok(soapNoteService.saveSoapNote(user.getUserId(), encounterId, soapNote));
    }
}
