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
public class AiConversationDto {
    private String id;
    private Long userId;
    private String title;
    private Instant createdAt;
    private Instant updatedAt;
    private long messageCount;
}
