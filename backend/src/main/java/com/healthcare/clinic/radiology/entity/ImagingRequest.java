package com.healthcare.clinic.radiology.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.PatientProfile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;

@Entity
@Table(name = "imaging_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ImagingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientProfile patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id")
    private DoctorProfile doctor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "procedure_id", nullable = false)
    private ImagingProcedure procedure;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "modality_id")
    private RadiologyModality modality;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String priority = "ROUTINE"; // ROUTINE, URGENT, STAT

    @Column(name = "clinical_notes", columnDefinition = "TEXT")
    private String clinicalNotes;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ORDERED"; // ORDERED, SCHEDULED, CHECKED_IN, PREPARATION, IN_PROGRESS, ACQUIRED, REPORTING, VERIFIED, RELEASED, CANCELLED, REJECTED, ON_HOLD

    @Column(name = "accession_number", length = 100)
    private String accessionNumber;

    @Column(name = "dicom_study_uid", length = 150)
    private String dicomStudyUid;

    @Column(name = "turnaround_target_sla")
    private ZonedDateTime turnaroundTargetSla;

    @CreationTimestamp
    @Column(name = "requested_at", nullable = false, updatable = false)
    private ZonedDateTime requestedAt;

    @Column(name = "scheduled_at")
    private ZonedDateTime scheduledAt;

    @Column(name = "checked_in_at")
    private ZonedDateTime checkedInAt;

    @Column(name = "queue_token", length = 50)
    private String queueToken;

    @Column(name = "queue_status", length = 50)
    @Builder.Default
    private String queueStatus = "WAITING"; // WAITING, CALLED, PREPARATION, IN_PROGRESS, COMPLETED, NO_SHOW, CANCELLED

    @Column(name = "preparation_completed")
    @Builder.Default
    private Boolean preparationCompleted = false;

    @Column(name = "preparation_notes", columnDefinition = "TEXT")
    private String preparationNotes;

    @Column(name = "acquisition_started_at")
    private ZonedDateTime acquisitionStartedAt;

    @Column(name = "acquisition_completed_at")
    private ZonedDateTime acquisitionCompletedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "performed_by_user_id")
    private User performedByUser;

    @Column(name = "technician_notes", columnDefinition = "TEXT")
    private String technicianNotes;

    @Column(name = "is_critical")
    @Builder.Default
    private Boolean isCritical = false;

    @Column(name = "critical_notes", columnDefinition = "TEXT")
    private String criticalNotes;

    @Column(name = "critical_acknowledged")
    @Builder.Default
    private Boolean criticalAcknowledged = false;

    @Column(name = "critical_acknowledged_by", length = 100)
    private String criticalAcknowledgedBy;

    @Column(name = "critical_acknowledged_at")
    private ZonedDateTime criticalAcknowledgedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "encounter_id")
    private com.healthcare.clinic.medicalrecord.entity.MedicalRecord encounter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private com.healthcare.clinic.branch.entity.Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private com.healthcare.clinic.billing.entity.Invoice invoice;

    @JsonProperty("accessionNumber")
    public String getEffectiveAccessionNumber() {
        if (accessionNumber != null && !accessionNumber.trim().isEmpty()) {
            return accessionNumber;
        }
        return String.format("ACC-2026-%05d", id != null ? id : 1);
    }

    @JsonProperty("dicomStudyUid")
    public String getEffectiveDicomStudyUid() {
        if (dicomStudyUid != null && !dicomStudyUid.trim().isEmpty()) {
            return dicomStudyUid;
        }
        return String.format("1.2.840.113619.2.55.3.%d.20261124.90823", id != null ? id : 1);
    }
}
