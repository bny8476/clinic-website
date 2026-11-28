package com.healthcare.clinic.lab.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.clinic.lab.dto.LabDashboardSummaryDto;
import com.healthcare.clinic.lab.dto.LabOrderRequestDto;
import com.healthcare.clinic.lab.dto.LabResultRequestDto;
import com.healthcare.clinic.lab.entity.LabRequest;
import com.healthcare.clinic.lab.service.LabService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab")
@RequiredArgsConstructor
@Slf4j
public class LabOperationsController {

    private final LabService labService;
    private final ObjectMapper objectMapper;

    @GetMapping("/operations/dashboard")
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<LabDashboardSummaryDto> getDashboardSummary(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(labService.getDashboardSummary(branchId));
    }

    @GetMapping("/requests/all")
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<LabRequest>> getAllRequests(@RequestParam(required = false, defaultValue = "1") Long branchId) {
        return ResponseEntity.ok(labService.getWorklist(null, null, null, PageRequest.of(0, 50)).getContent());
    }

    @GetMapping("/worklist")
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<Page<LabRequest>> getWorklist(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "ALL") String priority,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "100") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, size));
        return ResponseEntity.ok(labService.getWorklist(status, priority, search, pageable));
    }

    @GetMapping("/requests/{id}")
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<LabRequest> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(labService.getRequestById(id));
    }

    @PostMapping("/requests")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_NURSE')")
    public ResponseEntity<LabRequest> createRequest(@RequestBody LabOrderRequestDto dto) {
        return ResponseEntity.ok(labService.createRequest(dto));
    }

    @RequestMapping(value = "/requests/{id}/status", method = {RequestMethod.PUT, RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_NURSE')")
    public ResponseEntity<LabRequest> updateStatus(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) Map<String, String> body) {
        String finalStatus = status;
        if ((finalStatus == null || finalStatus.trim().isEmpty()) && body != null) {
            finalStatus = body.get("status");
        }
        return ResponseEntity.ok(labService.updateStatus(id, finalStatus));
    }

    @GetMapping("/requests/{id}/result")
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<LabRequest> getRequestResult(@PathVariable Long id) {
        return ResponseEntity.ok(labService.getRequestById(id));
    }

    @PostMapping(value = "/requests/{id}/result", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<LabRequest> saveResultMultipart(
            @PathVariable Long id,
            @RequestPart(value = "result", required = false) String resultJson,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        LabResultRequestDto dto = new LabResultRequestDto();
        if (resultJson != null && !resultJson.trim().isEmpty()) {
            try {
                dto = objectMapper.readValue(resultJson, LabResultRequestDto.class);
            } catch (Exception e) {
                log.warn("Failed to parse resultJson in multipart: {}", e.getMessage());
            }
        }
        return ResponseEntity.ok(labService.saveResult(id, dto, file));
    }

    @PostMapping(value = "/requests/{id}/result", consumes = { MediaType.APPLICATION_JSON_VALUE })
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<LabRequest> saveResultJson(
            @PathVariable Long id,
            @RequestBody LabResultRequestDto dto) {
        return ResponseEntity.ok(labService.saveResult(id, dto, null));
    }

    @GetMapping("/requests/status/{status}")
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<LabRequest>> getRequestsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(labService.getRequestsByStatus(status));
    }

    @RequestMapping(value = "/requests/{id}/verify", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<LabRequest> verifyRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        String comments = body != null && body.containsKey("comments") ? String.valueOf(body.get("comments")) : null;
        return ResponseEntity.ok(labService.verifyRequest(id, comments));
    }

    @RequestMapping(value = "/requests/{id}/reject", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<LabRequest> rejectSample(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        String reason = body != null && body.containsKey("reason") ? String.valueOf(body.get("reason")) : "Sample rejected by lab";
        return ResponseEntity.ok(labService.rejectSample(id, reason));
    }

    @RequestMapping(value = "/requests/{id}/critical/acknowledge", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<LabRequest> acknowledgeCritical(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String ackBy = body != null ? body.get("acknowledgedBy") : null;
        return ResponseEntity.ok(labService.acknowledgeCritical(id, ackBy));
    }

    @GetMapping("/requests/{id}/report/pdf")
    public ResponseEntity<byte[]> downloadReportPdf(@PathVariable Long id) {
        byte[] pdf = labService.generateReportPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"LabReport_" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/doctor/my-requests")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<LabRequest>> getDoctorRequests(@RequestParam(required = false) Long doctorId) {
        return ResponseEntity.ok(labService.getDoctorRequests(doctorId));
    }

    @GetMapping("/patient/lab-reports")
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_RECEPTION')")
    public ResponseEntity<List<LabRequest>> getPatientLabReports(@RequestParam(required = false) Long patientId) {
        return ResponseEntity.ok(labService.getPatientLabReports(patientId));
    }

    @PostMapping("/patient/requests/{id}/book")
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<LabRequest> bookPatientSample(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String dateStr = body.get("scheduledAt");
        ZonedDateTime scheduled = dateStr != null ? ZonedDateTime.parse(dateStr) : ZonedDateTime.now().plusDays(1);
        return ResponseEntity.ok(labService.bookPatientSample(id, scheduled));
    }
}
