package com.healthcare.clinic.doctor.medicine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineCartItemDto {
    private Long doctorMedicineId;
    private Long medicineId;
    private String name;
    private Integer quantity;
    private BigDecimal price;
    private String unit;
    private String dosage;
    private String instructions;
}
