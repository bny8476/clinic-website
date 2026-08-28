package com.healthcare.clinic.radiology.controller;

import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.radiology.entity.DicomStudy;
import com.healthcare.clinic.radiology.service.PacsIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/radiology/pacs")
@RequiredArgsConstructor
public class PacsController {

    private final PacsIntegrationService pacsService;

    @PostMapping("/upload/{requestId}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<DicomStudy> uploadDicom(
            @PathVariable Long requestId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal user) {
        String uploaderId = user != null && user.getUserId() != null ? user.getUserId().toString() : "system";
        return ResponseEntity.ok(pacsService.ingestDicomFile(requestId, file, uploaderId));
    }

    @GetMapping("/study/request/{requestId}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'RADIOLOGIST', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<DicomStudy> getStudyByRequest(@PathVariable Long requestId) {
        return pacsService.getStudyByRequestId(requestId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/viewer/{studyInstanceUid}/{filename}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'RADIOLOGIST', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<Resource> getDicomImage(
            @PathVariable String studyInstanceUid,
            @PathVariable String filename) {
        
        Resource file = pacsService.loadDicomAsResource(studyInstanceUid, filename);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(file);
    }
}
