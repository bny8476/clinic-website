package com.healthcare.clinic.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionRefillRequestDTO {
    private Long id;
    private Long prescriptionId;
    private Long patientId;
    private String status;
    private String notes;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private Long processedByDoctorId;
    
    // Additional prescription summary details
    private String doctorName;
    private String diagnosis;
}
