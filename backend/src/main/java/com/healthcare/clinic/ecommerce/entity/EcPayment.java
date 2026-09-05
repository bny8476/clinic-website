package com.healthcare.clinic.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "ec_payments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EcPayment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String provider = "STRIPE"; // RAZORPAY, STRIPE, MOCK

    @Column(name = "provider_ref", length = 200)
    private String providerRef;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 128)
    private String idempotencyKey;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "INITIATED"; // INITIATED, PENDING, AUTHORIZED, CAPTURED, FAILED, CANCELLED, REFUNDED, RECONCILED

    @Column(name = "pg_response")
    @JdbcTypeCode(SqlTypes.JSON)
    private String pgResponse;

    @Column(name = "webhook_verified", nullable = false)
    @Builder.Default
    private Boolean webhookVerified = false;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod; // UPI, CARD, WALLET, COD, NETBANKING

    @Column(name = "error_code", length = 100)
    private String errorCode;

    @Column(name = "error_description", length = 500)
    private String errorDescription;

    @Column(name = "initiated_at", nullable = false, updatable = false)
    @Builder.Default
    private ZonedDateTime initiatedAt = ZonedDateTime.now();

    @Column(name = "authorized_at")
    private ZonedDateTime authorizedAt;

    @Column(name = "captured_at")
    private ZonedDateTime capturedAt;

    @Column(name = "failed_at")
    private ZonedDateTime failedAt;

    @Column(name = "refund_ref", length = 200)
    private String refundRef;

    @Column(name = "refunded_at")
    private ZonedDateTime refundedAt;

    @Column(name = "refunded_amount", precision = 10, scale = 2)
    private BigDecimal refundedAmount;
}
