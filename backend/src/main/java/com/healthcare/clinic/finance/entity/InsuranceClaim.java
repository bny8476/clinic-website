package com.healthcare.clinic.finance.entity;

import com.healthcare.clinic.billing.entity.Invoice;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "insurance_claims")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsuranceClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @Column(name = "provider_name", nullable = false, length = 200)
    private String providerName;

    @Column(name = "claim_number", length = 100)
    private String claimNumber;

    @Column(name = "claimed_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal claimedAmount;

    @Column(name = "approved_amount", precision = 12, scale = 2)
    private BigDecimal approvedAmount;

    @Column(name = "deductible_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal deductibleAmount = BigDecimal.ZERO;

    @Column(name = "copay_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal copayAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ClaimStatus status = ClaimStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private ZonedDateTime submittedAt;

    @Column(name = "settled_at")
    private ZonedDateTime settledAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    public void prePersist() {
        if (submittedAt == null) {
            submittedAt = ZonedDateTime.now();
        }
        if (status == null) {
            status = ClaimStatus.SUBMITTED;
        }
        if (deductibleAmount == null) deductibleAmount = BigDecimal.ZERO;
        if (copayAmount == null) copayAmount = BigDecimal.ZERO;
    }
}
