package com.healthcare.clinic.nursing.controller;

import com.healthcare.clinic.inpatient.entity.Bed;
import com.healthcare.clinic.nursing.entity.BedAssignment;
import com.healthcare.clinic.inpatient.entity.Ward;
import com.healthcare.clinic.nursing.service.BedManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController("nursingBedManagementController")
@RequestMapping("/api/nursing/beds")
@RequiredArgsConstructor
public class BedManagementController {

    private final BedManagementService bedManagementService;

    @GetMapping("/branches/{branchId}/wards")
    @PreAuthorize("hasAnyRole('NURSE', 'CHARGE_NURSE', 'DOCTOR', 'SUPER_ADMIN')")
    public ResponseEntity<List<Ward>> getWards(@PathVariable Long branchId) {
        return ResponseEntity.ok(bedManagementService.getWardsByBranch(branchId));
    }

    @GetMapping("/wards/{wardId}/beds")
    @PreAuthorize("hasAnyRole('NURSE', 'CHARGE_NURSE', 'DOCTOR', 'SUPER_ADMIN')")
    public ResponseEntity<List<Bed>> getBeds(@PathVariable Long wardId) {
        return ResponseEntity.ok(bedManagementService.getBedsByWard(wardId));
    }

    @GetMapping("/encounters/{encounterId}/bed-assignments")
    @PreAuthorize("hasAnyRole('NURSE', 'CHARGE_NURSE', 'DOCTOR', 'SUPER_ADMIN')")
    public ResponseEntity<List<BedAssignment>> getEncounterAssignments(@PathVariable Long encounterId) {
        return ResponseEntity.ok(bedManagementService.getActiveAssignmentsByEncounter(encounterId));
    }

    @PostMapping("/beds/{bedId}/assign")
    @PreAuthorize("hasAnyRole('CHARGE_NURSE', 'SUPER_ADMIN')")
    public ResponseEntity<BedAssignment> assignBed(
            @PathVariable Long bedId,
            @RequestParam Long patientId,
            @RequestParam Long encounterId,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(bedManagementService.assignBed(bedId, patientId, encounterId, notes));
    }

    @PostMapping("/assignments/{assignmentId}/discharge")
    @PreAuthorize("hasAnyRole('CHARGE_NURSE', 'SUPER_ADMIN')")
    public ResponseEntity<BedAssignment> dischargeBed(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(bedManagementService.dischargePatientFromBed(assignmentId));
    }
}
