package com.healthcare.clinic.finance.entity;

import com.healthcare.clinic.branch.entity.Branch;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "cashier_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CashierSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"operatingHours", "staffAssignments", "tenant", "hibernateLazyInitializer", "handler"})
    private Branch branch;

    @Column(name = "cashier_id", nullable = false)
    private Long cashierId;

    @Column(name = "opening_float", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingFloat;

    @Column(name = "closing_float", precision = 12, scale = 2)
    private BigDecimal closingFloat;

    @Column(name = "cash_collections", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal cashCollections = BigDecimal.ZERO;

    @Column(name = "card_collections", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal cardCollections = BigDecimal.ZERO;

    @Column(name = "digital_collections", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal digitalCollections = BigDecimal.ZERO;

    @Column(name = "refunds_issued", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal refundsIssued = BigDecimal.ZERO;

    @Column(name = "variance_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal varianceAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.OPEN;

    @CreationTimestamp
    @Column(name = "opened_at", nullable = false, updatable = false)
    private ZonedDateTime openedAt;

    @Column(name = "closed_at")
    private ZonedDateTime closedAt;
    
    @Column(name = "approved_by")
    private Long approvedBy;

    @PrePersist
    public void prePersist() {
        if (openedAt == null) {
            openedAt = ZonedDateTime.now();
        }
        if (cashCollections == null) cashCollections = BigDecimal.ZERO;
        if (cardCollections == null) cardCollections = BigDecimal.ZERO;
        if (digitalCollections == null) digitalCollections = BigDecimal.ZERO;
        if (refundsIssued == null) refundsIssued = BigDecimal.ZERO;
        if (varianceAmount == null) varianceAmount = BigDecimal.ZERO;
        if (status == null) status = SessionStatus.OPEN;
    }

    public enum SessionStatus {
        OPEN,
        CLOSED,
        DISCREPANCY,
        APPROVED
    }
}
