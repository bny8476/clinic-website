package com.healthcare.clinic.lab.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.PatientProfile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "lab_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LabRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lab_request_number", nullable = false, unique = true, length = 50)
    private String labRequestNumber;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_profile_id")
    private PatientProfile patientProfile;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_user_id")
    private User patientUser;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id")
    private DoctorProfile doctorProfile;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_user_id")
    private User doctorUser;

    @Column(name = "patient_first_name", length = 100)
    private String patientFirstName;

    @Column(name = "patient_last_name", length = 100)
    private String patientLastName;

    @Column(name = "doctor_name", length = 150)
    private String doctorName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "test_catalog_id")
    private TestCatalog testCatalog;

    @Column(name = "branch_id")
    @Builder.Default
    private Long branchId = 1L;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String priority = "ROUTINE"; // ROUTINE, URGENT, STAT

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "REQUESTED"; // REQUESTED, SAMPLE_COLLECTED, PROCESSING, RESULT_ENTERED, VERIFIED, RELEASED, REJECTED, CANCELLED

    @Column(name = "clinical_notes", columnDefinition = "TEXT")
    private String clinicalNotes;

    @Column(name = "result_value", columnDefinition = "TEXT")
    private String resultValue;

    @Column(name = "reference_range", length = 200)
    private String referenceRange;

    @Column(length = 50)
    private String unit;

    @Column(name = "is_abnormal")
    @Builder.Default
    private Boolean isAbnormal = false;

    @Column(name = "is_critical")
    @Builder.Default
    private Boolean isCritical = false;

    @Column(name = "critical_acknowledged")
    @Builder.Default
    private Boolean criticalAcknowledged = false;

    @Column(name = "critical_acknowledged_by", length = 100)
    private String criticalAcknowledgedBy;

    @Column(name = "critical_acknowledged_at")
    private ZonedDateTime criticalAcknowledgedAt;

    @Column(name = "technical_comments", columnDefinition = "TEXT")
    private String technicalComments;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "recollection_required")
    @Builder.Default
    private Boolean recollectionRequired = false;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "verified_by_user_id")
    private User verifiedBy;

    @Column(name = "verified_at")
    private ZonedDateTime verifiedAt;

    @CreationTimestamp
    @Column(name = "requested_at", nullable = false, updatable = false)
    private ZonedDateTime requestedAt;

    @Column(name = "scheduled_at")
    private ZonedDateTime scheduledAt;

    @Column(name = "collected_at")
    private ZonedDateTime collectedAt;

    @Column(name = "received_at")
    private ZonedDateTime receivedAt;

    @Column(name = "processing_started_at")
    private ZonedDateTime processingStartedAt;

    @Column(name = "result_entered_at")
    private ZonedDateTime resultEnteredAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    @JsonProperty("patient")
    public Map<String, Object> getPatient() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", patientId);
        map.put("patientId", patientId);
        if (patientProfile != null) {
            map.put("opNumber", patientProfile.getOpNumber());
            map.put("gender", patientProfile.getGender());
            map.put("dateOfBirth", patientProfile.getDateOfBirth() != null ? patientProfile.getDateOfBirth().toString() : null);
            map.put("bloodGroup", patientProfile.getBloodGroup());
        }
        String fName = patientUser != null ? patientUser.getFirstName() : (patientFirstName != null ? patientFirstName : "Patient");
        String lName = patientUser != null ? patientUser.getLastName() : (patientLastName != null ? patientLastName : "");
        map.put("firstName", fName);
        map.put("lastName", lName);
        map.put("fullName", (fName + " " + lName).trim());

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", patientUser != null ? patientUser.getId() : patientId);
        userMap.put("firstName", fName);
        userMap.put("lastName", lName);
        userMap.put("email", patientUser != null ? patientUser.getEmail() : null);
        userMap.put("phone", patientUser != null ? patientUser.getPhoneNumber() : null);
        map.put("user", userMap);

        return map;
    }

    @JsonProperty("doctor")
    public Map<String, Object> getDoctor() {
        Map<String, Object> map = new HashMap<>();
        String name = doctorName;
        if (doctorUser != null) {
            name = "Dr. " + (doctorUser.getFirstName() + " " + doctorUser.getLastName()).trim();
            map.put("id", doctorUser.getId());
            map.put("firstName", doctorUser.getFirstName());
            map.put("lastName", doctorUser.getLastName());
        } else if (doctorProfile != null) {
            map.put("id", doctorProfile.getId());
        }
        map.put("name", name != null ? name : "Attending Physician");
        return map;
    }

    @JsonProperty("doctorUser")
    public Map<String, Object> getDoctorUserInfo() {
        Map<String, Object> map = new HashMap<>();
        if (doctorUser != null) {
            map.put("id", doctorUser.getId());
            map.put("firstName", doctorUser.getFirstName());
            map.put("lastName", doctorUser.getLastName());
            map.put("email", doctorUser.getEmail());
        } else {
            map.put("firstName", "Attending");
            map.put("lastName", "Doctor");
        }
        return map;
    }
}
