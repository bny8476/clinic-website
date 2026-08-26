package com.healthcare.clinic.reception.entity;

import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.patient.entity.PatientProfile;
import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;

@Entity
@Table(name = "walk_in_registrations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

public class WalkInRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "op_number", length = 50, unique = true)
    private String opNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private PatientProfile patient; // Can be null if new/unregistered

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(length = 20)
    private String phone;

    @Column(name = "reason_for_visit", columnDefinition = "TEXT")
    private String reasonForVisit;

    @Column(name = "registered_at", updatable = false)
    @Builder.Default
    private ZonedDateTime registeredAt = ZonedDateTime.now();

    @Column(length = 50)
    @Builder.Default
    private String status = "WAITING"; // WAITING, IN_CONSULTATION, COMPLETED, CANCELLED
}
