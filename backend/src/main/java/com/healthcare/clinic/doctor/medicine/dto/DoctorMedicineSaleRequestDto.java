package com.healthcare.clinic.doctor.medicine.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorMedicineSaleRequestDto {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long prescriptionId;
    private Long branchId;

    @NotEmpty(message = "At least one medicine item is required")
    @Valid
    private List<DoctorMedicineSaleItemDto> items;
}
