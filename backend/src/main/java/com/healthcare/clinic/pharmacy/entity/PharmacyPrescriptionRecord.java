package com.healthcare.clinic.pharmacy.entity;

import com.healthcare.clinic.inventory.entity.BaseEntity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "PharmacyPrescriptionRecord")
@Table(name = "pharmacy_prescriptions")
@SQLDelete(sql = "UPDATE pharmacy_prescriptions SET is_deleted = true WHERE id=?")
@SQLRestriction("is_deleted=false")
@Data
@EqualsAndHashCode(callSuper=true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyPrescriptionRecord extends BaseEntity {

    @Column(name = "patient_name", nullable = false)
    private String patientName;

    @Column(name = "doctor_name")
    private String doctorName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Doctor doctor;

    @Column(name = "prescription_date", nullable = false)
    private LocalDateTime prescriptionDate;

    @Column(nullable = false)
    private String status; // PENDING, DISPENSED, CANCELLED

    @Builder.Default
    @Column(name = "verification_status", nullable = false)
    private String verificationStatus = "UNVERIFIED"; // UNVERIFIED, VERIFIED, REJECTED

    @Column(name = "verified_by")
    private String verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /** FK back to the clinical prescriptions table — the source of truth */
    @Column(name = "clinical_prescription_id", unique = true)
    private Long clinicalPrescriptionId;

    @Column(name = "assigned_pharmacy_user_id")
    private Long assignedPharmacyUserId;

    /** Medication line items copied from the doctor's prescription */
    @OneToMany(mappedBy = "pharmacyPrescription", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PharmacyPrescriptionItem> items = new ArrayList<>();

    @Column(name = "dispensed_at")
    private LocalDateTime dispensedAt;

    @Column(name = "dispensed_by")
    private String dispensedBy;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Builder.Default
    @Column(name = "refills_allowed")
    private Integer refillsAllowed = 0;

    @Builder.Default
    @Column(name = "refills_remaining")
    private Integer refillsRemaining = 0;

    @Builder.Default
    @Column(name = "refill_interval_days")
    private Integer refillIntervalDays = 0;

    @Column(name = "doctor_registration_number")
    private String doctorRegistrationNumber;

    // ── helpers ────────────────────────────────────────────────────────────────
    public void addItem(PharmacyPrescriptionItem item) {
        if (items == null) items = new java.util.ArrayList<>();
        items.add(item);
        item.setPharmacyPrescription(this);
    }
}
