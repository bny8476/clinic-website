package com.healthcare.clinic.emr.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.ZonedDateTime;

@Entity(name="EmrClinicalReferral")
@Table(name = "clinical_referrals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicalReferral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "encounter_id")
    private Long encounterId;

    @Column(name = "referring_doctor_id", nullable = false)
    private Long referringDoctorId;

    @Column(name = "referred_to_doctor_id")
    private Long referredToDoctorId; // For internal referrals

    @Column(name = "referred_to_provider_name", length = 255)
    private String referredToProviderName; // For external

    @Column(name = "referred_to_specialty", length = 255)
    private String referredToSpecialty;

    @Column(name = "referral_reason", nullable = false, columnDefinition = "TEXT")
    private String referralReason;

    @Column(nullable = false, length = 50)
    private String urgency; // ROUTINE, URGENT

    @Column(nullable = false, length = 50)
    private String status; // PENDING, SCHEDULED, COMPLETED, DECLINED

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
}
