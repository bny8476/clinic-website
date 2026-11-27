package com.healthcare.clinic.hr.controller;

import com.healthcare.clinic.hr.entity.Attendance;
import com.healthcare.clinic.hr.entity.Employee;
import com.healthcare.clinic.hr.entity.LeaveRequest;
import com.healthcare.clinic.hr.entity.JobApplication;
import com.healthcare.clinic.hr.entity.JobRequisition;
import com.healthcare.clinic.hr.entity.OffboardingRequest;
import com.healthcare.clinic.hr.entity.OnboardingChecklist;
import com.healthcare.clinic.hr.entity.EmployeeDocument;
import com.healthcare.clinic.hr.entity.EmployeeCredential;
import com.healthcare.clinic.hr.service.HrService;
import com.healthcare.clinic.hr.service.OffboardingService;
import com.healthcare.clinic.hr.service.OnboardingService;
import com.healthcare.clinic.hr.service.RecruitmentService;
import com.healthcare.clinic.hr.service.HrDocumentService;
import com.healthcare.clinic.hr.service.CredentialService;
import com.healthcare.clinic.hr.service.HrReportingService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
public class HrController {

    private final HrService hrService;
    private final RecruitmentService recruitmentService;
    private final OnboardingService onboardingService;
    private final OffboardingService offboardingService;
    private final HrDocumentService hrDocumentService;
    private final CredentialService credentialService;
    private final HrReportingService hrReportingService;

    @GetMapping("/reports/analytics")
    public ResponseEntity<java.util.Map<String, Object>> getHrReportsAnalytics(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String timeRange,
            @RequestParam(required = false, defaultValue = "ALL") String department) {
        return ResponseEntity.ok(hrReportingService.getComprehensiveHrReport(timeRange, department));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<java.util.Map<String, Object>> getHrDashboardSummary() {
        List<Employee> employees = hrService.getAllEmployees();
        LocalDate today = LocalDate.now();
        List<Attendance> todayAttendance = hrService.getAttendanceByDate(today);
        List<LeaveRequest> allLeaves = hrService.getAllLeaveRequests();
        List<JobRequisition> activeReqs = recruitmentService.getActiveRequisitions();

        long totalEmployees = employees.size();
        long presentToday = todayAttendance.stream()
                .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
                .count();
        long pendingLeaves = allLeaves.stream()
                .filter(l -> "PENDING".equalsIgnoreCase(l.getStatus()))
                .count();
        long onLeaveToday = allLeaves.stream()
                .filter(l -> "APPROVED".equalsIgnoreCase(l.getStatus()))
                .filter(l -> l.getStartDate() != null && l.getEndDate() != null &&
                        !today.isBefore(l.getStartDate()) && !today.isAfter(l.getEndDate()))
                .count();
        long absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday);

        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("totalEmployees", totalEmployees);
        summary.put("presentToday", presentToday);
        summary.put("onLeaveToday", onLeaveToday);
        summary.put("absentToday", absentToday);
        summary.put("pendingLeaves", pendingLeaves);
        summary.put("activeRequisitions", activeReqs.size());
        summary.put("recentEmployees", employees.stream().limit(6).toList());
        summary.put("pendingLeaveRequests", allLeaves.stream()
                .filter(l -> "PENDING".equalsIgnoreCase(l.getStatus()))
                .limit(10)
                .toList());

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/employees")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(hrService.getAllEmployees());
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable Long id) {
        return hrService.getEmployeeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/employees")
    public ResponseEntity<Employee> createEmployee(@RequestBody Employee employee) {
        return ResponseEntity.ok(hrService.createEmployee(employee));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id, @RequestBody Employee employee) {
        return ResponseEntity.ok(hrService.updateEmployee(id, employee));
    }

    @RequestMapping(value = "/employees/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<Employee> toggleEmployeeStatus(
            @PathVariable Long id,
            @RequestParam(required = false) Boolean active,
            @RequestBody(required = false) java.util.Map<String, Object> body) {
        Boolean targetActive = active;
        if (targetActive == null && body != null && body.containsKey("isActive")) {
            targetActive = Boolean.valueOf(String.valueOf(body.get("isActive")));
        } else if (targetActive == null && body != null && body.containsKey("active")) {
            targetActive = Boolean.valueOf(String.valueOf(body.get("active")));
        }
        return ResponseEntity.ok(hrService.toggleEmployeeStatus(id, targetActive));
    }

    @PostMapping("/attendance/check-in/{employeeId}")
    public ResponseEntity<Attendance> checkIn(@PathVariable Long employeeId) {
        return ResponseEntity.ok(hrService.checkIn(employeeId));
    }

    @PostMapping("/attendance/check-out/{employeeId}")
    public ResponseEntity<Attendance> checkOut(@PathVariable Long employeeId) {
        return ResponseEntity.ok(hrService.checkOut(employeeId));
    }

    @GetMapping("/attendance")
    public ResponseEntity<List<Attendance>> getAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(hrService.getAttendanceByDateRange(startDate, endDate));
        }
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(hrService.getAttendanceByDate(targetDate));
    }

    @PostMapping("/attendance/manual")
    public ResponseEntity<Attendance> recordManualAttendance(@RequestBody java.util.Map<String, Object> body) {
        Long employeeId = Long.valueOf(String.valueOf(body.get("employeeId")));
        LocalDate date = body.get("date") != null ? LocalDate.parse(String.valueOf(body.get("date"))) : LocalDate.now();
        String checkIn = body.get("checkIn") != null ? String.valueOf(body.get("checkIn")) : null;
        String checkOut = body.get("checkOut") != null ? String.valueOf(body.get("checkOut")) : null;
        String status = body.get("status") != null ? String.valueOf(body.get("status")) : "PRESENT";
        String remarks = body.get("remarks") != null ? String.valueOf(body.get("remarks")) : null;

        return ResponseEntity.ok(hrService.recordManualAttendance(employeeId, date, checkIn, checkOut, status, remarks));
    }

    @PutMapping("/attendance/{id}")
    public ResponseEntity<Attendance> updateAttendance(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body) {
        String checkIn = body.get("checkIn") != null ? String.valueOf(body.get("checkIn")) : null;
        String checkOut = body.get("checkOut") != null ? String.valueOf(body.get("checkOut")) : null;
        String status = body.get("status") != null ? String.valueOf(body.get("status")) : null;
        String remarks = body.get("remarks") != null ? String.valueOf(body.get("remarks")) : null;

        return ResponseEntity.ok(hrService.updateAttendanceRecord(id, checkIn, checkOut, status, remarks));
    }

    @DeleteMapping("/attendance/{id}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Long id) {
        hrService.deleteAttendanceRecord(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/attendance/bulk-check-in")
    public ResponseEntity<List<Attendance>> bulkCheckIn(@RequestBody java.util.Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Object> rawIds = (List<Object>) body.get("employeeIds");
        List<Long> employeeIds = rawIds != null
                ? rawIds.stream().map(o -> Long.valueOf(String.valueOf(o))).toList()
                : java.util.Collections.emptyList();
        LocalDate date = body.get("date") != null ? LocalDate.parse(String.valueOf(body.get("date"))) : LocalDate.now();
        String checkIn = body.get("checkIn") != null ? String.valueOf(body.get("checkIn")) : null;
        String status = body.get("status") != null ? String.valueOf(body.get("status")) : "PRESENT";

        return ResponseEntity.ok(hrService.bulkCheckIn(employeeIds, date, checkIn, status));
    }

    @GetMapping("/leaves")
    public ResponseEntity<List<LeaveRequest>> getLeaves() {
        return ResponseEntity.ok(hrService.getAllLeaveRequests());
    }

    @PostMapping("/leaves")
    public ResponseEntity<LeaveRequest> submitLeave(@RequestBody LeaveRequest leaveRequest) {
        return ResponseEntity.ok(hrService.submitLeaveRequest(leaveRequest));
    }

    @PutMapping("/leaves/{id}")
    public ResponseEntity<LeaveRequest> updateLeave(
            @PathVariable Long id,
            @RequestBody LeaveRequest updated) {
        return ResponseEntity.ok(hrService.updateLeaveRequest(id, updated));
    }

    @DeleteMapping("/leaves/{id}")
    public ResponseEntity<Void> deleteLeave(@PathVariable Long id) {
        hrService.deleteLeaveRequest(id);
        return ResponseEntity.noContent().build();
    }

    @RequestMapping(value = "/leaves/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<LeaveRequest> updateLeaveStatus(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal user) {
        String effectiveStatus = status;
        if ((effectiveStatus == null || effectiveStatus.isBlank()) && body != null && body.containsKey("status")) {
            effectiveStatus = String.valueOf(body.get("status"));
        }
        if (effectiveStatus == null || effectiveStatus.isBlank()) {
            effectiveStatus = "APPROVED";
        }
        return ResponseEntity.ok(hrService.updateLeaveStatus(id, effectiveStatus, user != null ? user.getUserId() : null));
    }

    // Recruitment Endpoints
    @GetMapping("/requisitions")
    public ResponseEntity<List<JobRequisition>> getAllRequisitions() {
        return ResponseEntity.ok(recruitmentService.getAllRequisitions());
    }

    @PostMapping("/requisitions")
    public ResponseEntity<JobRequisition> createRequisition(@RequestBody JobRequisition requisition) {
        return ResponseEntity.ok(recruitmentService.createRequisition(requisition));
    }

    @GetMapping("/requisitions/active")
    public ResponseEntity<List<JobRequisition>> getActiveRequisitions() {
        return ResponseEntity.ok(recruitmentService.getActiveRequisitions());
    }

    @PutMapping("/requisitions/{id}")
    public ResponseEntity<JobRequisition> updateRequisition(@PathVariable Long id, @RequestBody JobRequisition requisition) {
        return ResponseEntity.ok(recruitmentService.updateRequisition(id, requisition));
    }

    @DeleteMapping("/requisitions/{id}")
    public ResponseEntity<Void> deleteRequisition(@PathVariable Long id) {
        recruitmentService.deleteRequisition(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/applications")
    public ResponseEntity<List<JobApplication>> getAllApplications() {
        return ResponseEntity.ok(recruitmentService.getAllApplications());
    }

    @PostMapping("/applications")
    public ResponseEntity<JobApplication> submitApplication(@RequestBody JobApplication application) {
        if (application.getJobRequisition() != null && application.getJobRequisition().getId() != null) {
            return ResponseEntity.ok(recruitmentService.applyForJob(application.getJobRequisition().getId(), application));
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/requisitions/{id}/apply")
    public ResponseEntity<JobApplication> applyForJob(@PathVariable Long id, @RequestBody JobApplication application) {
        return ResponseEntity.ok(recruitmentService.applyForJob(id, application));
    }

    @RequestMapping(value = "/applications/{id}/status", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<JobApplication> updateApplicationStatus(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) java.util.Map<String, Object> body) {
        String effectiveStatus = status;
        if ((effectiveStatus == null || effectiveStatus.isBlank()) && body != null && body.containsKey("status")) {
            effectiveStatus = String.valueOf(body.get("status"));
        }
        if (effectiveStatus == null || effectiveStatus.isBlank()) {
            effectiveStatus = "SCREENING";
        }
        return ResponseEntity.ok(recruitmentService.updateApplicationStatus(id, effectiveStatus));
    }

    @DeleteMapping("/applications/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
        recruitmentService.deleteApplication(id);
        return ResponseEntity.noContent().build();
    }

    // Onboarding Endpoints
    @PostMapping("/onboarding/{employeeId}")
    public ResponseEntity<OnboardingChecklist> initiateOnboarding(@PathVariable Long employeeId) {
        return ResponseEntity.ok(onboardingService.initiateOnboarding(employeeId));
    }

    @PutMapping("/onboarding/{checklistId}/status")
    public ResponseEntity<OnboardingChecklist> updateChecklistStatus(@PathVariable Long checklistId, @RequestParam String status) {
        return ResponseEntity.ok(onboardingService.updateChecklistStatus(checklistId, status));
    }

    // Offboarding Endpoints
    @PostMapping("/offboarding/{employeeId}")
    public ResponseEntity<OffboardingRequest> initiateOffboarding(
            @PathVariable Long employeeId,
            @RequestParam String reason,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate lastWorkingDay) {
        return ResponseEntity.ok(offboardingService.initiateOffboarding(employeeId, reason, lastWorkingDay));
    }

    @PutMapping("/offboarding/{requestId}/status")
    public ResponseEntity<OffboardingRequest> updateOffboardingStatus(@PathVariable Long requestId, @RequestParam String status) {
        return ResponseEntity.ok(offboardingService.updateOffboardingStatus(requestId, status));
    }

    // Document Endpoints
    @PostMapping("/employee-documents")
    public ResponseEntity<EmployeeDocument> uploadDocument(@RequestBody EmployeeDocument document) {
        return ResponseEntity.ok(hrDocumentService.uploadDocument(document));
    }

    @GetMapping("/employee-documents/{employeeId}")
    public ResponseEntity<List<EmployeeDocument>> getEmployeeDocuments(@PathVariable Long employeeId) {
        return ResponseEntity.ok(hrDocumentService.getEmployeeDocuments(employeeId));
    }

    @PutMapping("/employee-documents/{documentId}/verify")
    public ResponseEntity<EmployeeDocument> verifyDocument(@PathVariable Long documentId, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(hrDocumentService.verifyDocument(documentId, user != null ? user.getUserId() : null));
    }

    // Credential Endpoints
    @PostMapping("/credentials")
    public ResponseEntity<EmployeeCredential> addCredential(@RequestBody EmployeeCredential credential) {
        return ResponseEntity.ok(credentialService.addCredential(credential));
    }

    @GetMapping("/credentials/{employeeId}")
    public ResponseEntity<List<EmployeeCredential>> getEmployeeCredentials(@PathVariable Long employeeId) {
        return ResponseEntity.ok(credentialService.getEmployeeCredentials(employeeId));
    }

    @PutMapping("/credentials/{credentialId}/verify")
    public ResponseEntity<EmployeeCredential> verifyCredential(@PathVariable Long credentialId) {
        return ResponseEntity.ok(credentialService.verifyCredential(credentialId));
    }
}
