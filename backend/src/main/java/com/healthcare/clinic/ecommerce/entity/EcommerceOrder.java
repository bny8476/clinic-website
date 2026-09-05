package com.healthcare.clinic.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ecommerce_orders")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(exclude = "items")
@ToString(exclude = "items")
public class EcommerceOrder {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── V22 original fields ───────────────────────────────────────────────────
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "shipping_address", columnDefinition = "TEXT", nullable = false)
    private String shippingAddress;

    @Column(name = "shipping_city", nullable = false, length = 100)
    private String shippingCity;

    @Column(name = "postal_code", nullable = false, length = 20)
    private String postalCode;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "shipped_at")
    private ZonedDateTime shippedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EcommerceOrderItem> items = new ArrayList<>();

    // ── Phase 17 extended fields ──────────────────────────────────────────────

    @Column(name = "order_number", unique = true, length = 30)
    private String orderNumber;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "doctor_id")
    private Long doctorId;

    @Column(name = "cart_id")
    private Long cartId;

    @Column(name = "address_id")
    private Long addressId;

    @Column(name = "coupon_id")
    private Long couponId;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "tax_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "shipping_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal shippingAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "loyalty_points_used", nullable = false)
    @Builder.Default
    private Integer loyaltyPointsUsed = 0;

    @Column(name = "idempotency_key", unique = true, length = 128)
    private String idempotencyKey;

    @Column(name = "prescription_review_required", nullable = false)
    @Builder.Default
    private Boolean prescriptionReviewRequired = false;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "invoice_id")
    private Long invoiceId;

    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private String paymentStatus = "PENDING";

    @Column(name = "fulfillment_status", nullable = false, length = 30)
    @Builder.Default
    private String fulfillmentStatus = "PENDING";

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(length = 500)
    private String notes;

    @Column(name = "confirmed_at")
    private ZonedDateTime confirmedAt;

    @Column(name = "packed_at")
    private ZonedDateTime packedAt;

    @Column(name = "dispatched_at")
    private ZonedDateTime dispatchedAt;

    @Column(name = "delivered_at")
    private ZonedDateTime deliveredAt;

    @Column(name = "returned_at")
    private ZonedDateTime returnedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
