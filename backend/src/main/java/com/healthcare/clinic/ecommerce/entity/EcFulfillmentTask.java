package com.healthcare.clinic.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.ZonedDateTime;

@Entity
@Table(name = "ec_fulfillment_tasks")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EcFulfillmentTask {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, IN_PROGRESS, PRESCRIPTION_REVIEW, PACKED, HANDED_OFF, CANCELLED

    @Column(name = "prescription_verified", nullable = false)
    @Builder.Default
    private Boolean prescriptionVerified = false;

    @Column(name = "prescription_verified_by")
    private Long prescriptionVerifiedBy;

    @Column(name = "prescription_verified_at")
    private ZonedDateTime prescriptionVerifiedAt;

    @Column(name = "items_picked")
    @JdbcTypeCode(SqlTypes.JSON)
    private String itemsPicked; // JSON: [{productId, batchId, qty, pickedAt}]

    @Column(name = "packing_evidence_url", length = 500)
    private String packingEvidenceUrl;

    @Column(length = 500)
    private String notes;

    @Column(name = "started_at")
    private ZonedDateTime startedAt;

    @Column(name = "completed_at")
    private ZonedDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private ZonedDateTime createdAt = ZonedDateTime.now();
}
