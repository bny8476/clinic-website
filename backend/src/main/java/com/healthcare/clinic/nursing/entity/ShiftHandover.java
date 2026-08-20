package com.healthcare.clinic.nursing.entity;

import com.healthcare.clinic.inpatient.entity.Ward;

import com.healthcare.clinic.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.ZonedDateTime;

@Entity
@Table(name = "shift_handovers")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftHandover {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outgoing_nurse_id", nullable = false)
    private User outgoingNurse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incoming_nurse_id", nullable = false)
    private User incomingNurse;

    @CreatedDate
    @Column(name = "handover_time", updatable = false)
    private ZonedDateTime handoverTime;

    @Column(name = "shift_summary", columnDefinition = "TEXT", nullable = false)
    private String shiftSummary;

    @Column(name = "pending_tasks", columnDefinition = "TEXT")
    private String pendingTasks;

    @Column(name = "critical_patients", columnDefinition = "TEXT")
    private String criticalPatients;

    @Column(nullable = false)
    @Builder.Default
    private String status = "DRAFT";
}
