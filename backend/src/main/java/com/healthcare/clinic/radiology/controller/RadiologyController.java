package com.healthcare.clinic.radiology.controller;

import com.healthcare.clinic.radiology.entity.ImagingProcedure;
import com.healthcare.clinic.radiology.entity.ImagingRequest;
import com.healthcare.clinic.radiology.entity.RadiologyReport;
import com.healthcare.clinic.radiology.service.RadiologyService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import lombok.Data;
import java.time.ZonedDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/radiology")
@RequiredArgsConstructor
public class RadiologyController {

    private final RadiologyService radiologyService;

    @GetMapping("/procedures")
    public ResponseEntity<List<ImagingProcedure>> getProcedures() {
        return ResponseEntity.ok(radiologyService.getProcedures());
    }

    @PostMapping("/procedures")
    @PreAuthorize("hasRole('RADIOLOGIST') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ImagingProcedure> createProcedure(@RequestBody ImagingProcedure procedure) {
        return ResponseEntity.ok(radiologyService.createProcedure(procedure));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasRole('RADIOLOGIST') or hasRole('DOCTOR') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<ImagingRequest>> getRequests(@RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(radiologyService.getRequestsByStatus(status));
        }
        return ResponseEntity.ok(radiologyService.getAllRequests());
    }

    @PostMapping("/requests")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('RADIOLOGIST') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ImagingRequest> createRequest(@RequestBody ImagingRequest request) {
        return ResponseEntity.ok(radiologyService.createRequest(request));
    }

    @PatchMapping("/requests/{id}/status")
    @PreAuthorize("hasRole('RADIOLOGIST') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ImagingRequest> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(radiologyService.updateRequestStatus(id, status));
    }

    @GetMapping("/requests/{requestId}/report")
    public ResponseEntity<RadiologyReport> getReport(@PathVariable Long requestId) {
        return radiologyService.getReportByRequestId(requestId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/requests/{requestId}/report")
    @PreAuthorize("hasRole('RADIOLOGIST') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<RadiologyReport> saveReport(
            @PathVariable Long requestId,
            @RequestBody RadiologyReport report,
            @AuthenticationPrincipal UserPrincipal radiologist) {
        return ResponseEntity.ok(radiologyService.saveReport(requestId, report, radiologist));
    }

    @PostMapping("/patient/requests/{id}/book")
    @PreAuthorize("hasRole('PATIENT') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ImagingRequest> bookPatientRequest(
            @PathVariable Long id,
            @RequestBody RadScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        try {
            return ResponseEntity.ok(radiologyService.bookPatientRequest(id, request.getScheduledAt(), user));
        } catch (IllegalArgumentException ex) {
            if (ex.getMessage().equals("Forbidden")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
}

@Data
class RadScheduleRequest {
    private ZonedDateTime scheduledAt;
}
