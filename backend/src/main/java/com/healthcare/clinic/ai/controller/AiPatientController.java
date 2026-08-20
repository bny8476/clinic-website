package com.healthcare.clinic.ai.controller;

import com.healthcare.clinic.patient.entity.AiChatMessage;
import com.healthcare.clinic.patient.entity.AiChatSession;
import com.healthcare.clinic.ai.service.AiPatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/ai/patient")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class AiPatientController {
    
    private final AiPatientService aiPatientService;

    @PostMapping("/session")
    public ResponseEntity<AiChatSession> startSession(@RequestParam Long userId, @RequestParam Long tenantId) {
        return ResponseEntity.ok(aiPatientService.startSession(userId, tenantId));
    }
    
    @PostMapping("/session/{id}/message")
    public ResponseEntity<AiChatMessage> sendMessage(@PathVariable Long id, @RequestParam String content, @RequestParam Long userId, @RequestParam Long tenantId) {
        return ResponseEntity.ok(aiPatientService.processPatientMessage(id, content, userId, tenantId));
    }
    
    @GetMapping("/session/{id}")
    public ResponseEntity<List<AiChatMessage>> getSessionHistory(@PathVariable Long id) {
        return ResponseEntity.ok(aiPatientService.getHistory(id));
    }
}
