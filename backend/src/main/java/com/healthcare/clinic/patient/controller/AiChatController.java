package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.AiChatMessage;
import com.healthcare.clinic.patient.entity.AiChatSession;
import com.healthcare.clinic.patient.service.AiAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/patient/assistant")
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class AiChatController {

    private final AiAssistantService aiAssistantService;

    @PostMapping("/session")
    public ResponseEntity<AiChatSession> getOrCreateSession(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(aiAssistantService.getOrCreateActiveSession(user));
    }

    @GetMapping("/session/{sessionId}/messages")
    public ResponseEntity<List<AiChatMessage>> getSessionMessages(
            @AuthenticationPrincipal User user,
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(aiAssistantService.getSessionMessages(user, sessionId));
    }

    @PostMapping("/session/{sessionId}/message")
    public ResponseEntity<AiChatMessage> sendMessage(
            @AuthenticationPrincipal User user,
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> payload) {
        String content = payload.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(aiAssistantService.sendMessage(user, sessionId, content));
    }
}
