package com.healthcare.clinic.doctor.medicine.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorRecommendationRequestDto {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long consultationId;
    private Long prescriptionId;
    private Long branchId;

    @NotNull(message = "Items list cannot be empty")
    private List<Item> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Item {
        @NotNull(message = "Medicine product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        private String dosage;
        private String frequency;
        private String duration;
        private String route;
        private String instructions;
        private String doctorNotes;
    }
}
