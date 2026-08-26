package com.healthcare.clinic.reception.entity;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.branch.entity.Branch;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.ZonedDateTime;

@Entity
@Table(name = "queue_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "walk_in_id")
    private WalkInRegistration walkIn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(name = "token_number", nullable = false)
    private Integer tokenNumber;

    @Column(name = "generated_at", updatable = false)
    @Builder.Default
    private ZonedDateTime generatedAt = ZonedDateTime.now();

    @Column(length = 50)
    @Builder.Default
    private String status = "WAITING"; // WAITING, CALLED, SERVED, SKIPPED
    
    @Column(name = "generated_date", nullable = false)
    @Builder.Default
    private LocalDate generatedDate = LocalDate.now();

    @Column(name = "priority_level")
    @Builder.Default
    private Integer priorityLevel = 0;

    @Column(name = "current_department")
    @Builder.Default
    private String currentDepartment = "GENERAL";
}
