package com.healthcare.clinic.inpatient.controller;

import com.healthcare.clinic.audit.annotation.AuditableAction;
import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.inpatient.dto.AdmissionRequest;
import com.healthcare.clinic.inpatient.dto.DischargeRequest;
import com.healthcare.clinic.inpatient.dto.TransferRequest;
import com.healthcare.clinic.inpatient.entity.Admission;
import com.healthcare.clinic.inpatient.entity.BedTransfer;
import com.healthcare.clinic.inpatient.entity.DischargeSummary;
import com.healthcare.clinic.inpatient.service.AdmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inpatient/admissions")
@RequiredArgsConstructor
public class AdmissionController {

    private final AdmissionService admissionService;

    @GetMapping
    public ResponseEntity<List<Admission>> getAdmissions(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserPrincipal user) {
        Long branchId = user != null ? user.getBranchId() : null;
        return ResponseEntity.ok(admissionService.getAdmissions(branchId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Admission> getAdmission(@PathVariable Long id) {
        return ResponseEntity.ok(admissionService.getAdmission(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST')")
    @AuditableAction(module = "INPATIENT", action = "ADMIT_PATIENT")
    public ResponseEntity<Admission> admitPatient(
            @RequestBody AdmissionRequest req,
            @AuthenticationPrincipal UserPrincipal user) {
        Long branchId = user != null ? user.getBranchId() : null;
        Admission admission = admissionService.admitPatient(
                req.getPatientId(), 
                req.getDoctorId(), 
                req.getBedId(), 
                req.getAdmissionType(), 
                req.getReason(),
                branchId
        );
        return ResponseEntity.ok(admission);
    }

    @PostMapping("/{id}/transfer")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    @AuditableAction(module = "INPATIENT", action = "TRANSFER_BED")
    public ResponseEntity<BedTransfer> transferBed(
            @PathVariable Long id,
            @RequestBody TransferRequest req,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(admissionService.transferBed(id, req.getNewBedId(), req.getReason(), user));
    }

    @PostMapping("/{id}/discharge")
    @PreAuthorize("hasAnyRole('DOCTOR')")
    @AuditableAction(module = "INPATIENT", action = "DISCHARGE_PATIENT")
    public ResponseEntity<DischargeSummary> dischargePatient(
            @PathVariable Long id,
            @RequestBody DischargeRequest req) {
        return ResponseEntity.ok(admissionService.dischargePatient(id, req.getDischargingDoctorId(), req.getSummaryData()));
    }
}
