package com.healthcare.clinic.doctor.medicine.dto;

import com.healthcare.clinic.doctor.medicine.entity.MedicineOrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineOrderResponseDto {

    private Long id;
    private String orderNumber;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private Long prescriptionId;
    private Long branchId;
    private MedicineOrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal tax;
    private BigDecimal total;
    private String paymentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<MedicineOrderItemDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MedicineOrderItemDto {
        private Long id;
        private Long medicineId;
        private String medicineName;
        private String genericName;
        private String brandName;
        private String strength;
        private String dosageForm;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private String dosage;
        private String frequency;
        private String duration;
        private String instructions;
        private Boolean prescriptionRequired;
        private Integer availableStock;
    }
}
