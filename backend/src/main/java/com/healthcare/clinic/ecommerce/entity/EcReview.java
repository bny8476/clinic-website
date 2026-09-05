package com.healthcare.clinic.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import java.time.ZonedDateTime;

@Entity
@Table(name = "ec_reviews")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EcReview {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "order_item_id")
    private Long orderItemId;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Integer rating; // 1-5

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "images")
    @JdbcTypeCode(SqlTypes.JSON)
    private String images; // JSON array of image URLs

    @Column(name = "moderation_status", nullable = false, length = 20)
    @Builder.Default
    private String moderationStatus = "PENDING"; // PENDING, APPROVED, REJECTED, FLAGGED

    @Column(name = "moderation_note", length = 500)
    private String moderationNote;

    @Column(name = "moderated_by")
    private Long moderatedBy;

    @Column(name = "is_verified_purchase", nullable = false)
    @Builder.Default
    private Boolean isVerifiedPurchase = false;

    @Column(name = "helpful_count", nullable = false)
    @Builder.Default
    private Integer helpfulCount = 0;

    @Column(name = "reported_count", nullable = false)
    @Builder.Default
    private Integer reportedCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private ZonedDateTime createdAt = ZonedDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
