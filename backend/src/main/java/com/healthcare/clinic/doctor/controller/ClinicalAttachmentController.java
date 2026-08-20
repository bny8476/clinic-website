package com.healthcare.clinic.doctor.controller;

import com.healthcare.clinic.doctor.entity.ClinicalAttachment;
import com.healthcare.clinic.doctor.service.ClinicalAttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/v1/doctor/attachments")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class ClinicalAttachmentController {

    private final ClinicalAttachmentService attachmentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ClinicalAttachment> uploadAttachment(
            @RequestParam Long patientId,
            @RequestParam(required = false) Long encounterId,
            @RequestParam Long uploadedBy,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String description,
            @RequestPart("file") MultipartFile file) throws IOException {
        
        ClinicalAttachment attachment = attachmentService.uploadAttachment(patientId, encounterId, uploadedBy, documentType, description, file);
        return ResponseEntity.ok(attachment);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ClinicalAttachment>> getPatientAttachments(@PathVariable Long patientId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsForPatient(patientId));
    }

    @GetMapping("/encounter/{encounterId}")
    public ResponseEntity<List<ClinicalAttachment>> getEncounterAttachments(@PathVariable Long encounterId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsForEncounter(encounterId));
    }

    @GetMapping("/download/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long attachmentId) {
        // Find attachment by ID, assuming it's available via a method in the service or repo
        // For simplicity, returning 404 if this API is called in this mock version
        return ResponseEntity.notFound().build();
    }
}
