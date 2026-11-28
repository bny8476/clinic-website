package com.healthcare.clinic.radiology.controller;

import com.healthcare.clinic.radiology.dto.DicomStudyMetadataDto;
import com.healthcare.clinic.radiology.dto.RadiologyDashboardDto;
import com.healthcare.clinic.radiology.entity.ImagingProcedure;
import com.healthcare.clinic.radiology.entity.ImagingRequest;
import com.healthcare.clinic.radiology.entity.RadiologyModality;
import com.healthcare.clinic.radiology.entity.RadiologyReport;
import com.healthcare.clinic.radiology.service.RadiologyService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/radiology", "/api/v1/radiology"})
@RequiredArgsConstructor
@Slf4j
public class RadiologyController {

    private final RadiologyService radiologyService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'TECHNICIAN', 'NURSE', 'STAFF')")
    public ResponseEntity<RadiologyDashboardDto> getDashboardMetrics(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(radiologyService.getDashboardMetrics(branchId));
    }

    @GetMapping("/procedures")
    public ResponseEntity<List<ImagingProcedure>> getProcedures() {
        return ResponseEntity.ok(radiologyService.getProcedures());
    }

    @GetMapping("/modalities")
    public ResponseEntity<List<RadiologyModality>> getModalities() {
        return ResponseEntity.ok(radiologyService.getModalities());
    }

    @PostMapping("/procedures")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ImagingProcedure> createProcedure(@RequestBody ImagingProcedure procedure) {
        return ResponseEntity.ok(radiologyService.createProcedure(procedure));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'TECHNICIAN', 'NURSE', 'STAFF', 'PATIENT')")
    public ResponseEntity<List<ImagingRequest>> getRequests(@RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("ALL")) {
            return ResponseEntity.ok(radiologyService.getRequestsByStatus(status));
        }
        return ResponseEntity.ok(radiologyService.getAllRequests());
    }

    @GetMapping("/requests/{id}")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'TECHNICIAN', 'NURSE', 'STAFF', 'PATIENT')")
    public ResponseEntity<ImagingRequest> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(radiologyService.getRequestById(id));
    }

    @PostMapping("/requests")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RADIOLOGIST', 'ADMIN', 'SUPER_ADMIN', 'TECHNICIAN', 'NURSE')")
    public ResponseEntity<ImagingRequest> createRequest(@RequestBody ImagingRequest request) {
        return ResponseEntity.ok(radiologyService.createRequest(request));
    }

    @RequestMapping(value = "/requests/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'TECHNICIAN', 'ADMIN', 'SUPER_ADMIN', 'DOCTOR')")
    public ResponseEntity<ImagingRequest> updateStatus(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) Map<String, String> body) {
        String s = status;
        if ((s == null || s.trim().isEmpty()) && body != null) {
            s = body.get("status");
        }
        if (s == null) s = "ORDERED";
        return ResponseEntity.ok(radiologyService.updateRequestStatus(id, s));
    }

    @RequestMapping(value = "/requests/{id}/schedule", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'TECHNICIAN', 'ADMIN', 'SUPER_ADMIN', 'DOCTOR', 'STAFF')")
    public ResponseEntity<ImagingRequest> scheduleStudy(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String dtStr = body != null && body.containsKey("scheduledAt") ? String.valueOf(body.get("scheduledAt")) : null;
        ZonedDateTime scheduled = dtStr != null ? ZonedDateTime.parse(dtStr) : ZonedDateTime.now().plusHours(2);
        Long modalityId = body != null && body.containsKey("modalityId") ? Long.parseLong(String.valueOf(body.get("modalityId"))) : null;
        return ResponseEntity.ok(radiologyService.scheduleStudy(id, scheduled, modalityId));
    }

    @PostMapping("/requests/{id}/check-in")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'TECHNICIAN', 'ADMIN', 'SUPER_ADMIN', 'STAFF', 'NURSE')")
    public ResponseEntity<ImagingRequest> checkInPatient(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String token = body != null ? body.get("queueToken") : null;
        String notes = body != null ? body.get("preparationNotes") : null;
        return ResponseEntity.ok(radiologyService.checkInPatient(id, token, notes));
    }

    @PostMapping("/requests/{id}/acquire/start")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'TECHNICIAN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ImagingRequest> startAcquisition(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        Long techId = user != null ? user.getUserId() : null;
        return ResponseEntity.ok(radiologyService.startAcquisition(id, techId));
    }

    @PostMapping("/requests/{id}/acquire/complete")
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'TECHNICIAN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ImagingRequest> completeAcquisition(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("technicianNotes") : null;
        return ResponseEntity.ok(radiologyService.completeAcquisition(id, notes));
    }

    @GetMapping("/requests/{requestId}/report")
    public ResponseEntity<RadiologyReport> getReport(@PathVariable Long requestId) {
        return radiologyService.getReportByRequestId(requestId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @RequestMapping(value = "/requests/{requestId}/report", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'ADMIN', 'SUPER_ADMIN', 'DOCTOR')")
    public ResponseEntity<RadiologyReport> saveReport(
            @PathVariable Long requestId,
            @RequestBody RadiologyReport report,
            @AuthenticationPrincipal UserPrincipal radiologist) {
        return ResponseEntity.ok(radiologyService.saveReport(requestId, report, radiologist));
    }

    @RequestMapping(value = "/requests/{requestId}/verify", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<RadiologyReport> verifyReport(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal reviewer) {
        String comments = body != null ? body.get("comments") : null;
        return ResponseEntity.ok(radiologyService.verifyReport(requestId, comments, reviewer));
    }

    @RequestMapping(value = "/requests/{requestId}/critical/acknowledge", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasAnyRole('RADIOLOGIST', 'DOCTOR', 'NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ImagingRequest> acknowledgeCritical(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, String> body) {
        String ackBy = body != null ? body.get("acknowledgedBy") : "Attending Physician";
        return ResponseEntity.ok(radiologyService.acknowledgeCritical(requestId, ackBy));
    }

    @GetMapping("/requests/{requestId}/report/pdf")
    public ResponseEntity<byte[]> downloadReportPdf(@PathVariable Long requestId) {
        byte[] pdf = radiologyService.generateReportPdf(requestId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"RadiologyReport_" + requestId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping({"/dicom/study/request/{requestId}", "/v1/dicom/study/request/{requestId}"})
    public ResponseEntity<DicomStudyMetadataDto> getDicomStudyMetadata(@PathVariable Long requestId) {
        return ResponseEntity.ok(radiologyService.getDicomStudyMetadata(requestId));
    }

    @GetMapping("/doctor/my-requests")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<ImagingRequest>> getDoctorRequests(@RequestParam(required = false) Long doctorId) {
        return ResponseEntity.ok(radiologyService.getDoctorRequests(doctorId));
    }

    @GetMapping("/patient/reports")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'RECEPTION')")
    public ResponseEntity<List<ImagingRequest>> getPatientReports(@RequestParam(required = false) Long patientId) {
        return ResponseEntity.ok(radiologyService.getPatientReports(patientId));
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
            if ("Forbidden".equals(ex.getMessage())) {
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
