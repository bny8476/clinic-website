package com.healthcare.clinic.doctor.controller;

import com.healthcare.clinic.doctor.entity.ClinicalMessage;
import com.healthcare.clinic.doctor.service.ClinicalMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doctor/messages")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class ClinicalMessageController {

    private final ClinicalMessageService messageService;

    @PostMapping
    public ResponseEntity<ClinicalMessage> sendMessage(@RequestBody ClinicalMessage message) {
        return ResponseEntity.ok(messageService.sendMessage(message));
    }

    @GetMapping("/inbox/{doctorId}")
    public ResponseEntity<List<ClinicalMessage>> getInbox(@PathVariable Long doctorId) {
        return ResponseEntity.ok(messageService.getInbox(doctorId));
    }

    @GetMapping("/sent/{doctorId}")
    public ResponseEntity<List<ClinicalMessage>> getSentMessages(@PathVariable Long doctorId) {
        return ResponseEntity.ok(messageService.getSentMessages(doctorId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ClinicalMessage>> getPatientMessages(@PathVariable Long patientId) {
        return ResponseEntity.ok(messageService.getMessagesForPatient(patientId));
    }

    @PatchMapping("/{messageId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long messageId) {
        messageService.markAsRead(messageId);
        return ResponseEntity.ok().build();
    }
}
