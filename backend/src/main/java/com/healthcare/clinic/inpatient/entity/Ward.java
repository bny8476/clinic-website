package com.healthcare.clinic.inpatient.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "wards")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "ward_type", nullable = false, length = 50)
    private String wardType; // GENERAL, ICU, NICU, MATERNITY, ISOLATION

    @Column(name = "branch_id", nullable = false)
    private Long branchId;

    @Column(length = 50)
    private String floor;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacity = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
