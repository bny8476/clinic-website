package com.healthcare.clinic.appointment.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Data
@NoArgsConstructor
public class AppointmentResponseDto {
    private Long id;
    private String appointmentNumber;
    private String status;
    private String appointmentType;
    private String reasonForVisit;
    private String notes;
    private Long branchId;
    private Integer duration;
    private String paymentStatus;
    private ZonedDateTime createdAt;
    private Integer tokenNumber;

    // Slot info
    private Long slotId;
    private ZonedDateTime startTime;
    private ZonedDateTime endTime;

    // Doctor info
    private Long doctorId;
    private String doctorFirstName;
    private String doctorLastName;

    // Patient info
    private Long patientId;
    private String patientFirstName;
    private String patientLastName;

    public AppointmentResponseDto(
            Long id, String appointmentNumber, com.healthcare.clinic.appointment.entity.AppointmentStatus status, String appointmentType, String reasonForVisit, String notes, Long branchId, Integer duration, String paymentStatus, ZonedDateTime createdAt,
            Long slotId, ZonedDateTime startTime, ZonedDateTime endTime,
            Long doctorId, String doctorFirstName, String doctorLastName,
            Long patientId, String patientFirstName, String patientLastName) {
        this.id = id;
        this.appointmentNumber = appointmentNumber;
        this.status = status != null ? status.name() : null;
        this.appointmentType = appointmentType;
        this.reasonForVisit = reasonForVisit;
        this.notes = notes;
        this.branchId = branchId;
        this.duration = duration;
        this.paymentStatus = paymentStatus;
        this.createdAt = createdAt;
        this.slotId = slotId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.doctorId = doctorId;
        this.doctorFirstName = doctorFirstName;
        this.doctorLastName = doctorLastName;
        this.patientId = patientId;
        this.patientFirstName = patientFirstName;
        this.patientLastName = patientLastName;
    }
}

