package com.healthcare.clinic.pharmacy.entity;

import com.healthcare.clinic.inventory.entity.BaseEntity;



import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "prescriptions_dispensed")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionDispensed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prescription_id", nullable = false)
    private Long prescriptionId;

    @Column(name = "pharmacist_id", nullable = false)
    private Long pharmacistId;

    @Column(name = "dispensed_at", updatable = false)
    @Builder.Default
    private ZonedDateTime dispensedAt = ZonedDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "idempotency_key", unique = true, length = 100)
    private String idempotencyKey;

    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    @Column(name = "partial_dispense")
    private boolean partialDispense;

    @OneToMany(mappedBy = "dispensed", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PrescriptionDispensedItem> items = new ArrayList<>();
}
