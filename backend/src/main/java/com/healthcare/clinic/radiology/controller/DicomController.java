package com.healthcare.clinic.radiology.controller;

import com.healthcare.clinic.radiology.service.DicomService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/radiology/dicom")
@RequiredArgsConstructor
public class DicomController {

    private final DicomService dicomService;

    @GetMapping("/study/{studyId}")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'DOCTOR', 'SUPER_ADMIN', 'PATIENT')")
    public ResponseEntity<Map<String, Object>> getStudyMetadata(
            @PathVariable String studyId,
            @AuthenticationPrincipal UserPrincipal user,
            HttpServletRequest request) {
        Map<String, Object> metadata = dicomService.getStudyMetadata(studyId, user, request.getRemoteAddr());
        return ResponseEntity.ok(metadata);
    }

    @GetMapping("/study/request/{requestId}")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'DOCTOR', 'SUPER_ADMIN', 'PATIENT')")
    public ResponseEntity<Map<String, Object>> getStudyMetadataByRequestId(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal user,
            HttpServletRequest request) {
        Map<String, Object> metadata = dicomService.getStudyMetadataByRequestId(requestId, user, request.getRemoteAddr());
        return ResponseEntity.ok(metadata);
    }
    @PostMapping("/study/mock")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'SUPER_ADMIN')")
    public ResponseEntity<?> createMockStudy(
            @RequestParam Long requestId, 
            @RequestParam String modality,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(dicomService.saveStudyMock(requestId, modality, user));
    }
}
