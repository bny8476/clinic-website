package com.healthcare.clinic.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequest {

    private Object slotId;

    @jakarta.validation.constraints.Size(max = 500)
    private String reasonForVisit;

    private String holdId;

    private Long patientUserId;

    // Additional fields for direct panel scheduling
    private Long patientId;
    private String patientFirstName;
    private String patientLastName;
    private String patientEmail;
    private String patientPhone;
    private Long doctorId;
    private String appointmentDate;
    private String startTime;
    private String endTime;
    private String type;
    private String status;
    private String priority;
    private String notes;

    public Long getParsedSlotId() {
        if (slotId == null) return null;
        if (slotId instanceof Number) return ((Number) slotId).longValue();
        try {
            return Long.parseLong(slotId.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
