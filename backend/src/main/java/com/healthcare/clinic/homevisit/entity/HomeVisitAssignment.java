package com.healthcare.clinic.homevisit.entity;

import com.healthcare.clinic.patient.entity.HomeVisitRequest;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;

@Entity
@Table(name = "home_visit_assignments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class HomeVisitAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private Long tenantId;

    @OneToOne
    @JoinColumn(name = "request_id")
    private HomeVisitRequest request;

    @Column(nullable = false)
    private Long staffUserId;

    private String status; // EN_ROUTE, ARRIVED, COMPLETED

    @CreationTimestamp
    private LocalDateTime assignedAt;
}
