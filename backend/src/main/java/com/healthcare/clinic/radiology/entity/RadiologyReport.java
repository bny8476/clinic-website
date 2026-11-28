package com.healthcare.clinic.radiology.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.healthcare.clinic.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;
import java.util.Map;

@Entity
@Table(name = "radiology_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RadiologyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private ImagingRequest request;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "radiologist_id")
    private User radiologist;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String findings;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String impression;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @Column(columnDefinition = "TEXT")
    private String technique;

    @Column(columnDefinition = "TEXT")
    private String comparison;

    @Column(name = "clinical_indication", columnDefinition = "TEXT")
    private String clinicalIndication;

    @Column(name = "dicom_study_uid", length = 150)
    private String dicomStudyUid;

    @Column(name = "dicom_image_url", length = 500)
    private String dicomImageUrl;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, PENDING_REVIEW, FINALIZED, VERIFIED, AMENDED

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "finalized_at")
    private ZonedDateTime finalizedAt;

    @Column(name = "verified_at")
    private ZonedDateTime verifiedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "is_addendum", nullable = false)
    @Builder.Default
    private Boolean isAddendum = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_report_id")
    private RadiologyReport parentReport;

    @Column(name = "amendment_reason", columnDefinition = "TEXT")
    private String amendmentReason;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "structured_data")
    private Map<String, Object> structuredData;
}
