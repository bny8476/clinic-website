package com.healthcare.clinic.ai.service;

import com.healthcare.clinic.ai.dto.AiChatRequest;
import com.healthcare.clinic.ai.dto.AiChatResponse;
import com.healthcare.clinic.ai.entity.AiConversation;
import com.healthcare.clinic.ai.entity.AiMessage;
import com.healthcare.clinic.ai.repository.AiMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

    private final GroqClient groqClient;
    private final AiRateLimiterService rateLimiterService;
    private final ClinicContextRetriever contextRetriever;
    private final AiConversationService conversationService;
    private final AiMessageRepository messageRepository;
    private final PhiSanitizer phiSanitizer;

    private static final Pattern PROMPT_INJECTION_PATTERN = Pattern.compile(
            "(?i)(ignore\\s+all\\s+previous\\s+instructions|system\\s+prompt|reveal\\s+your\\s+instructions|show\\s+database\\s+credentials|bypass\\s+security|dump\\s+schema|select\\s+\\*\\s+from|delete\\s+from)"
    );

    public AiChatResponse processChat(AiChatRequest request, Long userId, String userRole, String clientIp) {
        // 1. Rate Limiting Check
        if (!rateLimiterService.isAllowed(userId, clientIp)) {
            return AiChatResponse.builder()
                    .success(false)
                    .conversationId(request.getConversationId())
                    .message("AI assistant request limit reached. Please try again later.")
                    .build();
        }

        // 2. Input Validation & Prompt Injection Protection
        String rawInput = request.getMessage();
        if (rawInput == null || rawInput.trim().isEmpty()) {
            return AiChatResponse.error("Message must not be empty");
        }

        if (rawInput.length() > 2000) {
            return AiChatResponse.error("Message exceeds maximum permitted length of 2000 characters.");
        }

        String sanitizedInput = phiSanitizer.sanitize(rawInput.trim());

        // Check prompt injection patterns
        if (PROMPT_INJECTION_PATTERN.matcher(sanitizedInput).find()) {
            log.warn("Prompt injection attempt detected from user {} IP {}", userId, clientIp);
            return AiChatResponse.ok(
                    request.getConversationId(),
                    "I am the official Aurelian Clinic Assistant. I am programmed to assist only with clinic appointments, services, medical department guidance, and healthcare general information."
            );
        }

        // 3. Conversation Management
        AiConversation conversation = conversationService.getOrCreateConversation(
                request.getConversationId(),
                userId,
                sanitizedInput
        );
        String conversationId = conversation.getId();

        // 4. Retrieve Context & Build System Prompt
        String clinicContext = contextRetriever.buildSanitizedContext(userId, userRole);
        String systemPrompt = buildSystemPrompt(clinicContext);

        // 5. Build Message Trajectory (System Prompt + Recent History + Current Input)
        List<Map<String, String>> messages = new ArrayList<>();

        Map<String, String> sysMsg = new HashMap<>();
        sysMsg.put("role", "system");
        sysMsg.put("content", systemPrompt);
        messages.add(sysMsg);

        // Append past conversation history (last 6 messages)
        try {
            List<AiMessage> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
            int start = Math.max(0, history.size() - 6);
            for (int i = start; i < history.size(); i++) {
                AiMessage h = history.get(i);
                Map<String, String> m = new HashMap<>();
                m.put("role", h.getRole());
                m.put("content", h.getContent());
                messages.add(m);
            }
        } catch (Exception e) {
            log.debug("No history found for conversation {}: {}", conversationId, e.getMessage());
        }

        // Append user prompt
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", sanitizedInput);
        messages.add(userMsg);

        // 6. Invoke Groq Client
        String aiReply = groqClient.chatCompletion(messages);

        // 7. Save Conversation History
        try {
            conversationService.saveMessage(conversationId, "user", sanitizedInput);
            conversationService.saveMessage(conversationId, "assistant", aiReply);
        } catch (Exception e) {
            log.error("Failed to persist conversation history: {}", e.getMessage());
        }

        return AiChatResponse.ok(conversationId, aiReply);
    }

    private String buildSystemPrompt(String clinicContext) {
        return """
                You are the official AI assistant for Aurelian Healthcare Clinic Management System.

                You can help users with:
                - Appointment booking guidance
                - Doctor information and availability
                - Clinic services and opening hours
                - Department information
                - Laboratory services
                - Pharmacy information
                - General medicine information
                - Prescription process guidance
                - Clinic website navigation
                - General healthcare education

                Strict Operating Rules:
                1. Do not diagnose diseases or conditions.
                2. Do not prescribe or modify medication doses.
                3. Do not claim to be a doctor or medical practitioner.
                4. Do not invent clinic information or fake prices.
                5. Use real clinic data provided below when available.
                6. Protect patient privacy at all times.
                7. Never expose another patient's medical or personal information.
                8. For medical emergencies (acute chest pain, stroke, severe bleeding), immediately advise the user to contact local emergency services (e.g. 911 / 112) or seek urgent emergency room care.
                9. Keep answers professional, helpful, polite, and concise.
                10. If requested information is unavailable, state clearly that you do not have that specific record.

                """ + clinicContext;
    }
}
