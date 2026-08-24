package com.healthcare.clinic.ai.controller;

import com.healthcare.clinic.ai.dto.AiChatRequest;
import com.healthcare.clinic.ai.dto.AiChatResponse;
import com.healthcare.clinic.ai.dto.AiConversationDto;
import com.healthcare.clinic.ai.dto.AiMessageDto;
import com.healthcare.clinic.ai.service.AiChatService;
import com.healthcare.clinic.ai.service.AiConversationService;
import com.healthcare.clinic.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiChatController {

    private final AiChatService aiChatService;
    private final AiConversationService conversationService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            @Valid @RequestBody AiChatRequest request,
            HttpServletRequest servletRequest
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        String userRole = getUserRoleFromContext();
        String clientIp = getClientIpAddress(servletRequest);

        AiChatResponse response = aiChatService.processChat(request, userId, userRole, clientIp);

        if (!response.isSuccess() && response.getMessage().contains("limit reached")) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<AiConversationDto>> getConversations() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(conversationService.getUserConversations(userId));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<List<AiMessageDto>> getConversationMessages(@PathVariable String id) {
        Long userId = SecurityUtils.getCurrentUserId();
        try {
            List<AiMessageDto> messages = conversationService.getConversationMessages(id, userId);
            return ResponseEntity.ok(messages);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable String id) {
        Long userId = SecurityUtils.getCurrentUserId();
        try {
            boolean deleted = conversationService.deleteConversation(id, userId);
            if (deleted) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/conversations/{id}/messages")
    public ResponseEntity<Void> clearMessages(@PathVariable String id) {
        Long userId = SecurityUtils.getCurrentUserId();
        try {
            boolean cleared = conversationService.clearConversationMessages(id, userId);
            if (cleared) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    private String getUserRoleFromContext() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getAuthorities().isEmpty()) {
            return auth.getAuthorities().iterator().next().getAuthority();
        }
        return "ROLE_ANONYMOUS";
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
