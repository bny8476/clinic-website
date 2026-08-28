package com.healthcare.clinic.laboratory.entity;

import com.healthcare.clinic.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "lab_processing_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabProcessingDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private LabTestRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_technician_id")
    private User assignedTechnician;

    @Column(name = "machine_used", length = 100)
    private String machineUsed;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "started_at")
    @Builder.Default
    private ZonedDateTime startedAt = ZonedDateTime.now();
}