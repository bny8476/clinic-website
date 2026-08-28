package com.healthcare.clinic.laboratory.controller;

import com.healthcare.clinic.audit.annotation.AuditableAction;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.laboratory.entity.LabResult;
import com.healthcare.clinic.laboratory.entity.LabTestCatalog;
import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import com.healthcare.clinic.laboratory.repository.LabResultRepository;
import com.healthcare.clinic.laboratory.repository.LabTestCatalogRepository;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;

import com.healthcare.clinic.notification.event.LabResultReleasedEvent;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.SecurityUtils;
import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.laboratory.service.LabPdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZonedDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.healthcare.clinic.laboratory.service.LabWorklistService;
import com.healthcare.clinic.laboratory.entity.LabBarcode;
import com.healthcare.clinic.laboratory.service.LabBarcodeService;

@RestController
@RequestMapping("/api/lab")
@RequiredArgsConstructor
public class LabController {

    private final LabTestCatalogRepository catalogRepository;
    private final LabTestRequestRepository requestRepository;
    private final LabResultRepository resultRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final com.healthcare.clinic.laboratory.service.LabResultService resultService;
    private final com.healthcare.clinic.laboratory.service.LabReportVerificationService verificationService;
    private final com.healthcare.clinic.laboratory.service.LabReportPdfGenerator pdfGenerator;
    private final LabPdfService labPdfService;
    private final LabWorklistService worklistService;
    private final LabBarcodeService barcodeService;

    // ─── Patient: own lab reports ─────────────────────────────────────────────

    /**
     * GET /api/patient/lab-reports
     * Returns all lab test requests for the currently logged-in patient.
     */
    @GetMapping("/patient/lab-reports")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    @AuditableAction(module = "LABORATORY", action = "VIEW", resourceType = "LabReport", sensitivityLevel = "NORMAL")
    public ResponseEntity<List<LabTestRequest>> getMyLabReports() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        var profileOpt = patientProfileRepository.findByUserId(userId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(
                requestRepository.findByPatientIdAndAcknowledgedAtIsNotNullOrderByRequestedAtDesc(profileOpt.get().getId()));
    }

    /**
     * POST /api/lab/patient/requests/{id}/book
     * Allows a patient to schedule their lab test request.
     */
    @PostMapping("/patient/requests/{id}/book")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    @AuditableAction(module = "LABORATORY", action = "SCHEDULE", resourceType = "LabTestRequest", sensitivityLevel = "NORMAL")
    public ResponseEntity<LabTestRequest> bookLabTest(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        Long userId = SecurityUtils.getCurrentUserId();
        
        LabTestRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
                
        if (!request.getPatient().getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your lab test request");
        }

        String scheduledAtStr = payload.get("scheduledAt");
        if (scheduledAtStr == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "scheduledAt is required");
        }

        request.setScheduledAt(ZonedDateTime.parse(scheduledAtStr));
        request.setStatus("SCHEDULED");
        
        return ResponseEntity.ok(requestRepository.save(request));
    }

    // ─── Doctor: lab requests I ordered ────────────────────────────────────────

    /**
     * GET /api/lab/doctor/my-requests
     * Returns all lab test requests ordered by the currently logged-in doctor.
     */
    @GetMapping("/doctor/my-requests")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_SUPER_ADMIN')")
    @AuditableAction(module = "LABORATORY", action = "VIEW", resourceType = "LabTestRequest", sensitivityLevel = "NORMAL")
    public ResponseEntity<List<LabTestRequest>> getMyDoctorLabRequests() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return ResponseEntity.ok(
                requestRepository.findByDoctorUserIdOrderByRequestedAtDesc(userId));
    }

    /**
     * GET /api/lab/doctor/unacknowledged
     * Returns all lab test requests ordered by the currently logged-in doctor that have not been acknowledged.
     */
    @GetMapping("/doctor/unacknowledged")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_SUPER_ADMIN')")
    @AuditableAction(module = "LABORATORY", action = "VIEW_UNACKNOWLEDGED", resourceType = "LabTestRequest", sensitivityLevel = "NORMAL")
    public ResponseEntity<List<LabTestRequest>> getUnacknowledgedDoctorLabRequests() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return ResponseEntity.ok(
                requestRepository.findByDoctorUserIdAndAcknowledgedAtIsNullAndStatusOrderByRequestedAtDesc(userId, "RELEASED"));
    }

    // ─── Catalog ──────────────────────────────────────────────────────────────

    @GetMapping("/catalog")
    public ResponseEntity<List<LabTestCatalog>> getCatalog() {
        return ResponseEntity.ok(catalogRepository.findByIsActiveTrue());
    }

    // ─── Worklist ─────────────────────────────────────────────────────────────

    /**
     * GET /api/lab/worklist
     * Returns a paginated, filterable worklist of all lab requests.
     * Used by LabWorklist.jsx frontend component.
     */
    @GetMapping("/worklist")
    @PreAuthorize("hasRole('LAB_TECH') or hasRole('NURSE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Page<LabTestRequest>> getWorklist(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        Page<LabTestRequest> result = worklistService.getWorklist(
                status != null && !status.equals("ALL") ? status : null,
                null, null, null, null, null, null, null, null,
                search,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "requestedAt")));
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/lab/requests/generate-barcodes
     * Generates barcodes for a list of lab request IDs.
     * Used by LabWorklist.jsx frontend component.
     */
    @PostMapping("/requests/generate-barcodes")
    @PreAuthorize("hasRole('LAB_TECH') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<List<LabBarcode>> generateBarcodes(@RequestBody List<Long> requestIds) {
        List<LabBarcode> barcodes = barcodeService.generateBarcodesForRequests(requestIds);
        return ResponseEntity.ok(barcodes);
    }

    @PostMapping("/requests")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('SUPER_ADMIN')")
    @AuditableAction(module = "LABORATORY", action = "CREATE", resourceType = "LabTestRequest", sensitivityLevel = "NORMAL")
    public ResponseEntity<LabTestRequest> createRequest(@RequestBody LabTestRequest request) {
        request.setStatus("REQUESTED");
        request.setRequestedAt(ZonedDateTime.now());
        return ResponseEntity.ok(requestRepository.save(request));
    }

    @GetMapping("/doctor/patient-reports/{patientId}")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<LabTestRequest>> getPatientLabReportsForDoctor(@PathVariable Long patientId) {
        return ResponseEntity.ok(requestRepository.findByPatientIdOrderByRequestedAtDesc(patientId));
    }

    @GetMapping("/requests/status/{status}")
    @PreAuthorize("hasRole('LAB_TECH') or hasRole('NURSE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<List<LabTestRequest>> getRequestsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(requestRepository.findByStatus(status));
    }

    /**
     * GET /api/lab/requests/all
     * Returns every lab request, most recent first.
     * Used by LabRecentRequests.jsx (lab dashboard, "All Requests" filter).
     */
    @GetMapping("/requests/all")
    @PreAuthorize("hasRole('LAB_TECH') or hasRole('NURSE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<List<LabTestRequest>> getAllRequests() {
        return ResponseEntity.ok(requestRepository.findAll(Sort.by(Sort.Direction.DESC, "requestedAt")));
    }

    @PutMapping("/requests/{requestId}/status")
    @PreAuthorize("hasRole('LAB_TECH') or hasRole('SUPER_ADMIN')")
    @AuditableAction(module = "LABORATORY", action = "EDIT_STATUS", resourceType = "LabTestRequest", sensitivityLevel = "HIGH")
    public ResponseEntity<LabTestRequest> updateRequestStatus(@PathVariable Long requestId, @RequestParam String status) {
        LabTestRequest request = requestRepository.findById(requestId).orElseThrow();
        request.setStatus(status);
        if ("SAMPLE_COLLECTED".equals(status)) {
            request.setSampleCollectedAt(ZonedDateTime.now());
        }
        LabTestRequest saved = requestRepository.save(request);

        // Publish notification when result is released
        if ("RELEASED".equals(status) && saved.getPatient() != null) {
            Long patientUserId = saved.getPatient().getUserId();
            String patientName = userRepository.findById(patientUserId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Patient");
            String patientEmail = userRepository.findById(patientUserId)
                    .map(u -> u.getEmail()).orElse(null);
            eventPublisher.publishEvent(LabResultReleasedEvent.builder()
                    .requestId(requestId)
                    .patientId(patientUserId)
                    .patientName(patientName)
                    .patientEmail(patientEmail)
                    .testName(saved.getTestCatalog() != null ? saved.getTestCatalog().getTestName() : "Unknown")
                    .build());
        }
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/requests/{requestId}/acknowledge")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('SUPER_ADMIN')")
    @AuditableAction(module = "LABORATORY", action = "ACKNOWLEDGE_RESULT", resourceType = "LabTestRequest", sensitivityLevel = "HIGH")
    public ResponseEntity<LabTestRequest> acknowledgeResult(@PathVariable Long requestId) {
        Long doctorId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(resultService.acknowledgeLabOrder(requestId, doctorId));
    }

    @PostMapping(value = "/requests/{requestId}/result", consumes = {"multipart/form-data", "application/json"})
    @PreAuthorize("hasRole('LAB_TECH') or hasRole('SUPER_ADMIN')")
    @AuditableAction(module = "LABORATORY", action = "ENTER_RESULT", resourceType = "LabResult", sensitivityLevel = "HIGH")
    public ResponseEntity<LabResult> addResult(
            @PathVariable Long requestId,
            @RequestPart("result") LabResult result,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal UserPrincipal labTech) {
        
        LabResult savedResult = resultService.addResult(requestId, result, labTech);
        
        // Handle file upload if present
        if (file != null && !file.isEmpty()) {
            // Placeholder for file storage logic
        }
        
        return ResponseEntity.ok(savedResult);
    }

    @PostMapping(value = "/doctor/upload-report", consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('DOCTOR') or hasRole('SUPER_ADMIN')")
    @AuditableAction(module = "LABORATORY", action = "UPLOAD_EXTERNAL_REPORT", resourceType = "ExternalLabReport", sensitivityLevel = "HIGH")
    public ResponseEntity<java.util.Map<String, String>> uploadExternalReport(
            @RequestParam("patient") Long patientId,
            @RequestParam("reportType") String reportType,
            @RequestParam("testName") String testName,
            @RequestParam("testDate") String testDate,
            @RequestParam("reportDate") String reportDate,
            @RequestParam("labName") String labName,
            @RequestParam(value = "refDoctor", required = false) String refDoctor,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestPart("files") List<MultipartFile> files,
            @AuthenticationPrincipal UserPrincipal doctor) {

        // In a real system, we would save the files to S3 or similar and create a record in the database
        // For now, we will create a mock upload directory
        try {
            java.io.File uploadDir = new java.io.File("uploads/reports");
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }
            
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                    java.io.File dest = new java.io.File(uploadDir, fileName);
                    file.transferTo(dest);
                }
            }
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload files");
        }

        // Ideally we'd save an ExternalLabReport entity. We will mock the response here.
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("status", "success");
        response.put("message", "Files uploaded successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/requests/{requestId}/verify")
    @PreAuthorize("hasRole('PATHOLOGIST') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<LabResult> verifyReport(
            @PathVariable Long requestId,
            @RequestBody java.util.Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal pathologist) {
        
        String comments = payload.get("comments");
        LabResult verifiedResult = verificationService.verifyReport(requestId, pathologist, comments);
        return ResponseEntity.ok(verifiedResult);
    }

    @GetMapping("/requests/{requestId}/report/pdf")
    @PreAuthorize("hasRole('PATIENT') or hasRole('DOCTOR') or hasRole('LAB_TECH') or hasRole('PATHOLOGIST') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<byte[]> downloadLabReportPdf(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal user) {
            
        LabTestRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lab request not found"));
                
        LabResult result = resultRepository.findByRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lab result not found for this request"));
                
        // Check authorization
        boolean isPatient = user.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_PATIENT") || r.getAuthority().equals("PATIENT"));
        if (isPatient) {
            if (!request.getPatient().getUserId().equals(user.getUserId())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
            }
        }
        
        byte[] pdfBytes = pdfGenerator.generateLabReport(request, result);
        
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "LabReport_" + requestId + ".pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @PutMapping("/requests/{requestId}/verify")
    @PreAuthorize("hasRole('LAB_TECH') or hasRole('SUPER_ADMIN')")
    @AuditableAction(module = "LABORATORY", action = "VERIFY_RESULT", resourceType = "LabResult", sensitivityLevel = "HIGH")
    public ResponseEntity<LabResult> verifyResult(@PathVariable Long requestId, @AuthenticationPrincipal UserPrincipal verifierPrincipal) {
        LabTestRequest request = requestRepository.findById(requestId).orElseThrow();
        LabResult result = resultRepository.findByRequestId(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Result not found"));
        
        User verifier = verifierPrincipal != null && verifierPrincipal.getUserId() != null
                ? userRepository.findById(verifierPrincipal.getUserId()).orElse(null)
                : null;

        result.setVerifiedAt(ZonedDateTime.now());
        result.setVerifiedBy(verifier);
        LabResult savedResult = resultRepository.save(result);
        
        request.setStatus("VERIFIED");
        requestRepository.save(request);
        
        return ResponseEntity.ok(savedResult);
    }

    @GetMapping("/results/{resultId}/pdf")
    @AuditableAction(module = "LABORATORY", action = "DOWNLOAD_PDF", resourceType = "LabResult", sensitivityLevel = "HIGH")
    public ResponseEntity<byte[]> downloadLabResultPdf(@PathVariable Long resultId) {
        byte[] pdf = labPdfService.generateLabResultPdf(resultId);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "lab_result_" + resultId + ".pdf");
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
