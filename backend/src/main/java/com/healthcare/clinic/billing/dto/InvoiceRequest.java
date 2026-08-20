package com.healthcare.clinic.billing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {
    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long appointmentId;
    private Long branchId;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Due date is required")
    private LocalDateTime dueDate;

    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    // Kept for backward compat; will be computed from items if items provided
    @DecimalMin(value = "0.0", inclusive = true)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Builder.Default
    private List<InvoiceItemRequest> items = new ArrayList<>();
}
