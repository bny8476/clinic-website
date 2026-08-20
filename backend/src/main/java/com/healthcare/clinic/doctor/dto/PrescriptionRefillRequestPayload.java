package com.healthcare.clinic.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionRefillRequestPayload {
    private Long prescriptionId;
    private String notes;
}
