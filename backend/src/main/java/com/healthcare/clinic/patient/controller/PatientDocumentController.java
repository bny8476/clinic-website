package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.PatientDocument;
import com.healthcare.clinic.patient.service.PatientDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patient/documents")
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class PatientDocumentController {

    private final PatientDocumentService patientDocumentService;

    @GetMapping
    public ResponseEntity<List<PatientDocument>> getPatientDocuments(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(patientDocumentService.getPatientDocuments(user));
    }

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PatientDocument> uploadDocument(
            @AuthenticationPrincipal User user,
            @RequestPart("document") PatientDocument document,
            @RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(patientDocumentService.saveDocumentMetadata(user, document, file));
    }
}
