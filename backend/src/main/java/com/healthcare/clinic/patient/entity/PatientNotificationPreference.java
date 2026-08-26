package com.healthcare.clinic.patient.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.ZonedDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "patient_notification_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PatientNotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientProfile patient;

    @Column(nullable = false, length = 50)
    private String category; // APPOINTMENTS, LAB_REPORTS, BILLING, MARKETING, etc.

    @Column(nullable = false)
    @Builder.Default
    private Boolean emailEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean smsEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean pushEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean inAppEnabled = true;

    @CreatedDate
    @Column(updatable = false)
    private ZonedDateTime createdAt;

    @LastModifiedDate
    private ZonedDateTime updatedAt;
}
