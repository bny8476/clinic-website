package com.healthcare.clinic.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private boolean success;
    private String conversationId;
    private String message;
    private String timestamp;

    public static AiChatResponse ok(String conversationId, String message) {
        return AiChatResponse.builder()
                .success(true)
                .conversationId(conversationId)
                .message(message)
                .timestamp(Instant.now().toString())
                .build();
    }

    public static AiChatResponse error(String message) {
        return AiChatResponse.builder()
                .success(false)
                .message(message)
                .timestamp(Instant.now().toString())
                .build();
    }
}
