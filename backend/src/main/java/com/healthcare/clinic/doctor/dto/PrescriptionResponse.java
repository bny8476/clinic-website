package com.healthcare.clinic.doctor.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PrescriptionResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private Integer patientAge;
    private String patientGender;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialty;
    private String doctorQualifications;
    private String registrationNumber;
    private String clinicName;
    private String clinicAddress;
    private String clinicPhone;
    private String clinicEmail;
    private Long appointmentId;
    private String chiefComplaint;
    private String diagnosis;
    private String symptoms;
    private String medicalHistory;
    private java.time.LocalDateTime followUpDate;
    private String notes;
    private Long encounterId;
    private String status;
    private LocalDateTime signedAt;
    private String signatureHash;
    private String pharmacyStatus;
    private LocalDateTime dispensedAt;
    private String dispensedBy;
    private List<PrescriptionItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Refill properties
    private Integer refillsAllowed;
    private Integer refillsRemaining;
    private Integer refillIntervalDays;
}
