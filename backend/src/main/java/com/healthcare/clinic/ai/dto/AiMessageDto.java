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
public class AiMessageDto {
    private Long id;
    private String conversationId;
    private String role;
    private String content;
    private Instant createdAt;
}
