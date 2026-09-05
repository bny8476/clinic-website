package com.healthcare.clinic.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import java.time.ZonedDateTime;

@Entity
@Table(name = "ec_shipments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EcShipment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(length = 100)
    private String carrier;

    @Column(name = "tracking_number", length = 200)
    private String trackingNumber;

    @Column(name = "carrier_ref", length = 200)
    private String carrierRef;

    @Column(name = "delivery_address_id")
    private Long deliveryAddressId;

    @Column(name = "weight_grams")
    private Integer weightGrams;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "READY"; // READY, ASSIGNED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED, RETURNED

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "assigned_at")
    private ZonedDateTime assignedAt;

    @Column(name = "picked_up_at")
    private ZonedDateTime pickedUpAt;

    @Column(name = "out_for_delivery_at")
    private ZonedDateTime outForDeliveryAt;

    @Column(name = "delivered_at")
    private ZonedDateTime deliveredAt;

    @Column(name = "failed_delivery_at")
    private ZonedDateTime failedDeliveryAt;

    @Column(name = "failure_reason", length = 300)
    private String failureReason;

    @Column(name = "proof_of_delivery_url", length = 500)
    private String proofOfDeliveryUrl;

    @Column(name = "otp_required", nullable = false)
    @Builder.Default
    private Boolean otpRequired = false;

    @Column(name = "otp_verified", nullable = false)
    @Builder.Default
    private Boolean otpVerified = false;

    @Column(name = "otp_hash", length = 128)
    private String otpHash;

    @Column(name = "otp_expires_at")
    private ZonedDateTime otpExpiresAt;

    @Column(name = "otp_attempts", nullable = false)
    @Builder.Default
    private Integer otpAttempts = 0;

    @Column(name = "max_otp_attempts", nullable = false)
    @Builder.Default
    private Integer maxOtpAttempts = 3;


    @Column(name = "cold_chain_evidence")
    @JdbcTypeCode(SqlTypes.JSON)
    private String coldChainEvidence;

    @Column(name = "return_to_origin", nullable = false)
    @Builder.Default
    private Boolean returnToOrigin = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private ZonedDateTime createdAt = ZonedDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
