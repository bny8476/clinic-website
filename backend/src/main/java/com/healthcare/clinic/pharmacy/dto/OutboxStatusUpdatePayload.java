package com.healthcare.clinic.pharmacy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboxStatusUpdatePayload {
    private Long clinicalPrescriptionId;
    private String status;
    private String pharmacistUsername;
    private LocalDateTime dispensedAt;
}
