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

    @GetMapping("/employees")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(hrService.getAllEmployees());
    }

    @PostMapping("/employees")
    public ResponseEntity<Employee> createEmployee(@RequestBody Employee employee) {
        return ResponseEntity.ok(hrService.createEmployee(employee));
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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(hrService.getAttendanceByDate(targetDate));
    }

    @GetMapping("/leaves")
    public ResponseEntity<List<LeaveRequest>> getLeaves() {
        return ResponseEntity.ok(hrService.getAllLeaveRequests());
    }

    @PostMapping("/leaves")
    public ResponseEntity<LeaveRequest> submitLeave(@RequestBody LeaveRequest leaveRequest) {
        return ResponseEntity.ok(hrService.submitLeaveRequest(leaveRequest));
    }

    @PatchMapping("/leaves/{id}/status")
    public ResponseEntity<LeaveRequest> updateLeaveStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(hrService.updateLeaveStatus(id, status, user != null ? user.getUserId() : null));
    }

    // Recruitment Endpoints
    @PostMapping("/requisitions")
    public ResponseEntity<JobRequisition> createRequisition(@RequestBody JobRequisition requisition) {
        return ResponseEntity.ok(recruitmentService.createRequisition(requisition));
    }

    @GetMapping("/requisitions/active")
    public ResponseEntity<List<JobRequisition>> getActiveRequisitions() {
        return ResponseEntity.ok(recruitmentService.getActiveRequisitions());
    }

    @PostMapping("/requisitions/{id}/apply")
    public ResponseEntity<JobApplication> applyForJob(@PathVariable Long id, @RequestBody JobApplication application) {
        return ResponseEntity.ok(recruitmentService.applyForJob(id, application));
    }

    @PutMapping("/applications/{id}/status")
    public ResponseEntity<JobApplication> updateApplicationStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(recruitmentService.updateApplicationStatus(id, status));
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
