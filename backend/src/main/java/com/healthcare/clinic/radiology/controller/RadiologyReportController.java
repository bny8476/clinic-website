package com.healthcare.clinic.radiology.controller;

import com.healthcare.clinic.radiology.entity.RadiologyReport;
import com.healthcare.clinic.radiology.repository.RadiologyReportRepository;
import com.healthcare.clinic.radiology.service.RadiologyReportingService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/radiology/requests/{requestId}/report")
@RequiredArgsConstructor
public class RadiologyReportController {

    private final RadiologyReportingService reportingService;
    private final RadiologyReportRepository reportRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<RadiologyReport> getReport(@PathVariable Long requestId) {
        return reportRepository.findByRequestId(requestId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'ADMIN')")
    public ResponseEntity<RadiologyReport> saveReport(
            @PathVariable Long requestId,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal user) {
        
        String findings = payload.get("findings");
        String impression = payload.get("impression");
        String status = payload.get("status");

        RadiologyReport report = reportingService.draftReport(requestId, findings, impression, user);
        
        if ("FINALIZED".equals(status)) {
            report = reportingService.finalizeReport(report.getId(), user);
        }

        return ResponseEntity.ok(report);
    }

    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'ADMIN')")
    public ResponseEntity<RadiologyReport> verifyReport(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal user) {
        RadiologyReport report = reportRepository.findByRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found for request"));
        return ResponseEntity.ok(reportingService.verifyReport(report.getId(), user));
    }

    @PostMapping("/release")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'ADMIN')")
    public ResponseEntity<RadiologyReport> releaseReport(
            @PathVariable Long requestId) {
        RadiologyReport report = reportRepository.findByRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found for request"));
        return ResponseEntity.ok(reportingService.releaseReport(report.getId()));
    }
}
