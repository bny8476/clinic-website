package com.healthcare.clinic.ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "ecommerce_order_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EcommerceOrderItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── V22 original fields ───────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private EcommerceOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private EcommerceProduct product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    // ── Phase 17 extended fields ──────────────────────────────────────────────

    @Column(name = "tax_class", length = 50)
    private String taxClass;

    @Column(name = "tax_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "cgst_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal cgstAmount = BigDecimal.ZERO;

    @Column(name = "sgst_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal sgstAmount = BigDecimal.ZERO;

    @Column(name = "igst_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal igstAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "sku_snapshot", length = 100)
    private String skuSnapshot;

    @Column(name = "product_name_snapshot", length = 300)
    private String productNameSnapshot;

    @Column(name = "medicine_name_snapshot", length = 300)
    private String medicineNameSnapshot;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "prescription_required", nullable = false)
    @Builder.Default
    private Boolean prescriptionRequired = false;

    @Column(name = "prescription_id")
    private Long prescriptionId;
}
