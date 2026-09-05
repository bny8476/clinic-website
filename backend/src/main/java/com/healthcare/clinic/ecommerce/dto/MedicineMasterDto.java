package com.healthcare.clinic.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
public class MedicineMasterDto {

    private Long id;

    @NotBlank(message = "Medicine Name is required")
    private String medicineName;

    private String genericName;
    private String brandName;
    private String manufacturer;
    private String category;
    private String composition;
    private String dosageForm;
    private String strength;
    private String packSize;
    private String unit;
    private String description;
    private String detailedDescription;
    private String indications;
    private String usageInstructions;
    private String warnings;
    private String precautions;
    private String sideEffects;
    private String storageInstructions;
    
    @Builder.Default
    private Boolean prescriptionRequired = false;

    @NotNull(message = "Price is required")
    @PositiveOrZero(message = "Price must be non-negative")
    private BigDecimal price;

    private BigDecimal discountPrice;
    
    @Builder.Default
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    @NotNull(message = "Stock Quantity is required")
    @PositiveOrZero(message = "Stock Quantity must be non-negative")
    private Integer stockQuantity;

    @Builder.Default
    private Integer minimumStockLevel = 10;

    private String medicineImage;
    
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, OUT_OF_STOCK

    private Long doctorId;
    private Long createdBy;
    private ZonedDateTime createdAt;
    private Long updatedBy;
    private ZonedDateTime updatedAt;
}
