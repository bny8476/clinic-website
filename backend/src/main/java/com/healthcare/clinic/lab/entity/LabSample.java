package com.healthcare.clinic.lab.entity;

import com.healthcare.clinic.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;

@Entity
@Table(name = "lab_samples")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LabSample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sample_barcode", nullable = false, unique = true, length = 100)
    private String sampleBarcode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lab_request_id", nullable = false)
    private LabRequest labRequest;

    @Column(name = "sample_type", nullable = false, length = 100)
    private String sampleType;

    @Column(name = "container_type", length = 100)
    private String containerType;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "COLLECTED"; // PENDING_COLLECTION, COLLECTED, RECEIVED, PROCESSING, REJECTED, RECOLLECTION_REQUIRED, COMPLETED

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "collected_by_user_id")
    private User collectedBy;

    @CreationTimestamp
    @Column(name = "collected_at")
    private ZonedDateTime collectedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "received_by_user_id")
    private User receivedBy;

    @Column(name = "received_at")
    private ZonedDateTime receivedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
}
