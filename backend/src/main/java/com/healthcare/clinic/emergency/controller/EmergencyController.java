package com.healthcare.clinic.emergency.controller;

import com.healthcare.clinic.audit.annotation.AuditableAction;
import com.healthcare.clinic.emergency.dto.DispositionRequest;
import com.healthcare.clinic.emergency.dto.DoctorAssignRequest;
import com.healthcare.clinic.emergency.dto.OrderRequest;
import com.healthcare.clinic.emergency.dto.RegisterPatientRequest;
import com.healthcare.clinic.emergency.dto.TriageRequest;
import com.healthcare.clinic.emergency.entity.EmergencyEncounter;
import com.healthcare.clinic.emergency.entity.EmergencyOrder;
import com.healthcare.clinic.emergency.entity.TriageAssessment;
import com.healthcare.clinic.emergency.service.EmergencyService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergency")
@RequiredArgsConstructor
public class EmergencyController {

    private final EmergencyService emergencyService;

    @GetMapping("/encounters")
    public ResponseEntity<List<EmergencyEncounter>> getEncounters(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserPrincipal user) {
        Long branchId = user != null ? user.getBranchId() : null;
        return ResponseEntity.ok(emergencyService.getEncounters(branchId, status));
    }

    @PostMapping("/encounters")
    @PreAuthorize("hasAnyRole('NURSE', 'RECEPTIONIST')")
    @AuditableAction(module = "EMERGENCY", action = "REGISTER_PATIENT")
    public ResponseEntity<EmergencyEncounter> registerPatient(
            @RequestBody RegisterPatientRequest req,
            @AuthenticationPrincipal UserPrincipal user) {
        Long branchId = user != null ? user.getBranchId() : null;
        return ResponseEntity.ok(emergencyService.registerPatient(req.getPatientId(), req.getArrivalMode(), branchId));
    }

    @PostMapping("/encounters/{id}/triage")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR')")
    @AuditableAction(module = "EMERGENCY", action = "PERFORM_TRIAGE")
    public ResponseEntity<TriageAssessment> performTriage(
            @PathVariable Long id,
            @RequestBody TriageRequest req,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(emergencyService.performTriage(id, req.getTriageLevel(), req.getChiefComplaint(), user));
    }

    @PostMapping("/encounters/{id}/assign-doctor")
    @PreAuthorize("hasAnyRole('NURSE', 'RECEPTIONIST', 'DOCTOR')")
    @AuditableAction(module = "EMERGENCY", action = "ASSIGN_DOCTOR")
    public ResponseEntity<EmergencyEncounter> assignDoctor(
            @PathVariable Long id,
            @RequestBody DoctorAssignRequest req) {
        return ResponseEntity.ok(emergencyService.assignDoctor(id, req.getDoctorId()));
    }

    @PostMapping("/encounters/{id}/orders")
    @PreAuthorize("hasAnyRole('DOCTOR')")
    @AuditableAction(module = "EMERGENCY", action = "PLACE_ORDER")
    public ResponseEntity<EmergencyOrder> placeOrder(
            @PathVariable Long id,
            @RequestBody OrderRequest req,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(emergencyService.placeOrder(id, req.getOrderType(), req.getReferenceId(), user));
    }

    @PostMapping("/encounters/{id}/disposition")
    @PreAuthorize("hasAnyRole('DOCTOR')")
    @AuditableAction(module = "EMERGENCY", action = "SET_DISPOSITION")
    public ResponseEntity<EmergencyEncounter> setDisposition(
            @PathVariable Long id,
            @RequestBody DispositionRequest req) {
        return ResponseEntity.ok(emergencyService.setDisposition(id, req.getDisposition()));
    }
}
