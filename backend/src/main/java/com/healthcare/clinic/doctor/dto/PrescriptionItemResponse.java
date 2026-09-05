package com.healthcare.clinic.doctor.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PrescriptionItemResponse {
    private Long id;
    private String medicationName;
    private String type;
    private String dosage;
    private String frequency;
    private String duration;
    private String instructions;
    private String strength;
    private String timing;
    private Long medicineId;
    private Integer prescribedQuantity;
    private Integer dispensedQuantity;
    private Integer remainingQuantity;
}
