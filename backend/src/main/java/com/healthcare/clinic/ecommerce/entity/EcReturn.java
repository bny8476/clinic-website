package com.healthcare.clinic.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ec_returns")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(exclude = "items")
@ToString(exclude = "items")
public class EcReturn {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "requested_by", nullable = false)
    private Long requestedBy;

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(name = "reason_detail", length = 500)
    private String reasonDetail;

    @Column(name = "evidence_urls")
    @JdbcTypeCode(SqlTypes.JSON)
    private String evidenceUrls; // JSON array of evidence image URLs

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "REQUESTED"; // REQUESTED, UNDER_REVIEW, APPROVED, REJECTED, PICKUP_SCHEDULED, RECEIVED, INSPECTED, REFUND_PENDING, REFUNDED

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "inspection_notes", length = 500)
    private String inspectionNotes;

    @Column(name = "pickup_scheduled_at")
    private ZonedDateTime pickupScheduledAt;

    @Column(name = "received_at")
    private ZonedDateTime receivedAt;

    @Column(name = "inspected_at")
    private ZonedDateTime inspectedAt;

    @Column(name = "restocked_at")
    private ZonedDateTime restockedAt;

    @Column(name = "disposed_at")
    private ZonedDateTime disposedAt;

    @OneToMany(mappedBy = "ecReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EcReturnItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private ZonedDateTime createdAt = ZonedDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
