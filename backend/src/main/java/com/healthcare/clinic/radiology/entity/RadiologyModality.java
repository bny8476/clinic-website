package com.healthcare.clinic.radiology.entity;

import com.healthcare.clinic.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;

@Entity
@Table(name = "radiology_modalities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RadiologyModality {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "modality_type", nullable = false, length = 30)
    private String modalityType; // XRAY, CT, MRI, ULTRASOUND, MAMMOGRAPHY, DEXA, PET, OTHER

    @Column(name = "room_location", length = 100)
    private String roomLocation;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "AVAILABLE"; // AVAILABLE, IN_USE, MAINTENANCE, OFFLINE

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_technician_id")
    private User assignedTechnician;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;
}
