package com.healthcare.clinic.reception.controller;

import com.healthcare.clinic.patient.entity.PatientDocument;
import com.healthcare.clinic.reception.entity.KioskCheckin;
import com.healthcare.clinic.reception.service.KioskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reception/kiosk")
@RequiredArgsConstructor
public class KioskController {

    private final KioskService kioskService;

    /**
     * Patient self check-in via kiosk terminal.
     * No auth required — kiosk is publicly accessible in the lobby.
     */
    @PostMapping("/self-checkin")
    public ResponseEntity<KioskCheckin> selfCheckIn(@RequestBody Map<String, Object> request) {
        Long branchId = Long.valueOf(request.get("branchId").toString());
        Long patientProfileId = request.containsKey("patientProfileId") && request.get("patientProfileId") != null
                ? Long.valueOf(request.get("patientProfileId").toString()) : null;
        Long appointmentId = request.containsKey("appointmentId") && request.get("appointmentId") != null
                ? Long.valueOf(request.get("appointmentId").toString()) : null;
        String station = (String) request.getOrDefault("kioskStation", "KIOSK-1");

        KioskCheckin checkin = kioskService.selfCheckIn(branchId, patientProfileId, appointmentId, station);
        return ResponseEntity.ok(checkin);
    }

    /**
     * Reception staff verifies a kiosk check-in.
     */
    @PutMapping("/{checkinId}/verify")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<KioskCheckin> verifyCheckin(
            @PathVariable Long checkinId,
            @RequestBody Map<String, Object> request) {
        String status = (String) request.getOrDefault("status", "VERIFIED");
        KioskCheckin checkin = kioskService.verifyCheckin(checkinId, status);
        return ResponseEntity.ok(checkin);
    }

    /**
     * Get today's kiosk check-ins for a branch.
     */
    @GetMapping("/branch/{branchId}/today")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<KioskCheckin>> getTodaysCheckins(@PathVariable Long branchId) {
        return ResponseEntity.ok(kioskService.getTodaysCheckins(branchId));
    }

    /**
     * Get branch dashboard stats (live counts).
     */
    @GetMapping("/branch/{branchId}/stats")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@PathVariable Long branchId) {
        return ResponseEntity.ok(kioskService.getDashboardStats(branchId));
    }

    /**
     * Upload a patient document from the reception desk scanner.
     */
    @PostMapping("/branch/{branchId}/documents")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<PatientDocument> uploadDocument(
            @PathVariable Long branchId,
            @RequestBody Map<String, Object> request) {

        Long patientProfileId = Long.valueOf(request.get("patientProfileId").toString());
        String title = (String) request.get("title");
        String documentType = (String) request.get("documentType");
        String fileUrl = (String) request.get("fileUrl");
        String scanDevice = (String) request.get("scanDevice");
        String notes = (String) request.get("notes");

        PatientDocument doc = kioskService.uploadDocumentForPatient(
                patientProfileId, branchId, title, documentType, fileUrl, scanDevice, notes);
        return ResponseEntity.ok(doc);
    }

    /**
     * Get all documents for a patient (reception desk view).
     */
    @GetMapping("/patient/{patientProfileId}/documents")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<PatientDocument>> getPatientDocuments(@PathVariable Long patientProfileId) {
        return ResponseEntity.ok(kioskService.getPatientDocuments(patientProfileId));
    }
}
