package com.healthcare.clinic.doctor.medicine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorRecommendationResponseDto {

    private Long id;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private Long consultationId;
    private Long prescriptionId;
    private Long productId;
    private String productName;
    private String brandName;
    private String genericName;
    private String strength;
    private String dosageForm;
    private BigDecimal price;
    private Integer stockQuantity;
    private Boolean prescriptionRequired;
    private Integer quantity;
    private String dosage;
    private String frequency;
    private String duration;
    private String route;
    private String instructions;
    private String doctorNotes;
    private String status;
    private Long branchId;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
}
