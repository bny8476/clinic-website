package com.healthcare.clinic.lab.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "test_catalogs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCatalog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_code", nullable = false, unique = true, length = 50)
    private String testCode;

    @Column(name = "test_name", nullable = false, length = 200)
    private String testName;

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String department = "General Pathology";

    @Column(name = "specimen_type", nullable = false, length = 100)
    @Builder.Default
    private String specimenType = "Whole Blood";

    @Column(name = "container_type", length = 100)
    @Builder.Default
    private String containerType = "EDTA Lavender Top";

    @Column(name = "turnaround_target_hours")
    @Builder.Default
    private Integer turnaroundTargetHours = 4;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "reference_range", length = 200)
    @Builder.Default
    private String referenceRange = "Normal";

    @Column(length = 50)
    @Builder.Default
    private String unit = "";

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
