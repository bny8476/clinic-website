package com.healthcare.clinic.surgery.controller;

import com.healthcare.clinic.audit.annotation.AuditableAction;
import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.surgery.dto.PreOpChecklistRequest;
import com.healthcare.clinic.surgery.dto.ScheduleSurgeryRequest;
import com.healthcare.clinic.surgery.dto.SurgeryNoteRequest;
import com.healthcare.clinic.surgery.entity.OperationTheatre;
import com.healthcare.clinic.surgery.entity.PreOpChecklist;
import com.healthcare.clinic.surgery.entity.SurgeryBooking;
import com.healthcare.clinic.surgery.entity.SurgeryNote;
import com.healthcare.clinic.surgery.service.SurgeryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/surgery")
@RequiredArgsConstructor
public class SurgeryController {

    private final SurgeryService surgeryService;

    @GetMapping("/theatres")
    public ResponseEntity<List<OperationTheatre>> getTheatres(@AuthenticationPrincipal UserPrincipal user) {
        Long branchId = user != null ? user.getBranchId() : null;
        return ResponseEntity.ok(surgeryService.getTheatres(branchId));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<SurgeryBooking>> getBookings(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserPrincipal user) {
        Long branchId = user != null ? user.getBranchId() : null;
        return ResponseEntity.ok(surgeryService.getBookings(branchId, status));
    }

    @PostMapping("/bookings")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST')")
    @AuditableAction(module = "SURGERY", action = "SCHEDULE_SURGERY")
    public ResponseEntity<SurgeryBooking> scheduleSurgery(
            @RequestBody ScheduleSurgeryRequest req) {
        return ResponseEntity.ok(surgeryService.scheduleSurgery(
                req.getPatientId(),
                req.getSurgeonId(),
                req.getOperationTheatreId(),
                req.getAdmissionId(),
                req.getSurgeryType(),
                req.getDiagnosis(),
                req.getScheduledStartTime(),
                req.getEstimatedDurationMinutes()
        ));
    }

    @PutMapping("/bookings/{id}/status")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    @AuditableAction(module = "SURGERY", action = "UPDATE_SURGERY_STATUS")
    public ResponseEntity<SurgeryBooking> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> req) {
        return ResponseEntity.ok(surgeryService.updateStatus(id, req.get("status")));
    }

    @PostMapping("/bookings/{id}/pre-op-checklist")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR')")
    @AuditableAction(module = "SURGERY", action = "SAVE_PRE_OP_CHECKLIST")
    public ResponseEntity<PreOpChecklist> savePreOpChecklist(
            @PathVariable Long id,
            @RequestBody PreOpChecklistRequest req,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(surgeryService.savePreOpChecklist(id, req.getChecklistData(), req.getNotes(), user));
    }

    @PostMapping("/bookings/{id}/notes")
    @PreAuthorize("hasAnyRole('DOCTOR')")
    @AuditableAction(module = "SURGERY", action = "SAVE_SURGERY_NOTE")
    public ResponseEntity<SurgeryNote> saveSurgeryNote(
            @PathVariable Long id,
            @RequestBody SurgeryNoteRequest req) {
        return ResponseEntity.ok(surgeryService.saveSurgeryNote(
                id,
                req.getSurgeonId(),
                req.getPreOpDiagnosis(),
                req.getPostOpDiagnosis(),
                req.getProcedurePerformed(),
                req.getFindings(),
                req.getComplications()
        ));
    }
}
