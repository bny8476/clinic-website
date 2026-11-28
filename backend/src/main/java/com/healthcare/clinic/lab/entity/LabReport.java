package com.healthcare.clinic.lab.entity;

import com.healthcare.clinic.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;

@Entity
@Table(name = "lab_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LabReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_number", nullable = false, unique = true, length = 50)
    private String reportNumber;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lab_request_id", nullable = false)
    private LabRequest labRequest;

    @Column(name = "report_status", nullable = false, length = 30)
    @Builder.Default
    private String reportStatus = "DRAFT"; // DRAFT, PENDING_VERIFICATION, VERIFIED, FINAL, AMENDED

    @Column(name = "pdf_url", columnDefinition = "TEXT")
    private String pdfUrl;

    @Column(name = "summary_findings", columnDefinition = "TEXT")
    private String summaryFindings;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "verified_by_user_id")
    private User verifiedBy;

    @Column(name = "verified_at")
    private ZonedDateTime verifiedAt;

    @Column(name = "finalized_at")
    private ZonedDateTime finalizedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;
}
