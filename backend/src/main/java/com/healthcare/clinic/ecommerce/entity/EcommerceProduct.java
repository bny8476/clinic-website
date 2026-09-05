package com.healthcare.clinic.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "ecommerce_products")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EcommerceProduct {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Basic fields (V22 original) ───────────────────────────────────────────
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String category = "WELLNESS";

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(unique = true, length = 100)
    private String sku;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "medicine_id")
    private Long medicineId;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    // ── Phase 17 extended fields ──────────────────────────────────────────────

    @Column(unique = true, length = 100)
    private String barcode;

    @Column(name = "generic_name", length = 300)
    private String genericName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private EcBrand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private EcCategory ecCategory;

    @Column(precision = 10, scale = 2)
    private BigDecimal mrp;

    @Column(name = "tax_class", nullable = false, length = 50)
    @Builder.Default
    private String taxClass = "MEDICINE_12";

    @Column(name = "hsn_code", length = 20)
    private String hsnCode;

    @Column(name = "pack_size", length = 100)
    private String packSize;

    @Column(name = "dosage_strength", length = 100)
    private String dosageStrength;

    @Column(name = "prescription_required", nullable = false)
    @Builder.Default
    private Boolean prescriptionRequired = false;

    @Column(name = "age_restriction")
    private Integer ageRestriction;

    @Column(name = "cold_chain_required", nullable = false)
    @Builder.Default
    private Boolean coldChainRequired = false;

    @Column(name = "regulatory_status", nullable = false, length = 50)
    @Builder.Default
    private String regulatoryStatus = "APPROVED";

    /**
     * Product lifecycle status:
     * DRAFT → ACTIVE → OUT_OF_STOCK → SUSPENDED → ARCHIVED
     */
    @Column(name = "product_status", nullable = false, length = 30)
    @Builder.Default
    private String productStatus = "DRAFT";

    @Column(name = "return_eligible", nullable = false)
    @Builder.Default
    private Boolean returnEligible = true;

    @Column(name = "images")
    @JdbcTypeCode(SqlTypes.JSON)
    private String images;  // JSON array of image URLs

    @Column(name = "specifications")
    @JdbcTypeCode(SqlTypes.JSON)
    private String specifications;  // JSON key-value pairs

    @Column(columnDefinition = "TEXT")
    private String ingredients;

    @Column(columnDefinition = "TEXT")
    private String warnings;

    @Column(name = "warranty_months")
    private Integer warrantyMonths;

    @Column(name = "weight_grams")
    private Integer weightGrams;

    @Column(name = "branch_id")
    private Long branchId;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @Column(name = "activated_at")
    private ZonedDateTime activatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    // ── Medicine Master extensions ───────────────────────────────────────────
    @Column(name = "brand_name", length = 200)
    private String brandName;

    @Column(length = 300)
    private String manufacturer;

    @Column(columnDefinition = "TEXT")
    private String composition;

    @Column(name = "dosage_form", length = 100)
    private String dosageForm;

    @Column(length = 100)
    private String strength;

    @Column(length = 50)
    private String unit;

    @Column(name = "detailed_description", columnDefinition = "TEXT")
    private String detailedDescription;

    @Column(columnDefinition = "TEXT")
    private String indications;

    @Column(name = "usage_instructions", columnDefinition = "TEXT")
    private String usageInstructions;

    @Column(columnDefinition = "TEXT")
    private String precautions;

    @Column(name = "side_effects", columnDefinition = "TEXT")
    private String sideEffects;

    @Column(name = "storage_instructions", columnDefinition = "TEXT")
    private String storageInstructions;

    @Column(name = "discount_price", precision = 10, scale = 2)
    private BigDecimal discountPrice;

    @Column(name = "tax_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    @Column(name = "minimum_stock_level")
    @Builder.Default
    private Integer minimumStockLevel = 10;

    @Column(name = "medicine_image", length = 500)
    private String medicineImage;

    @Column(name = "doctor_id")
    private Long doctorId;

    @Version
    private Long version;
}
