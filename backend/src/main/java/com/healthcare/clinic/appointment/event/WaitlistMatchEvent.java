package com.healthcare.clinic.appointment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaitlistMatchEvent {
    private Long waitlistEntryId;
    private Long patientUserId;
    private Long doctorUserId;
    private Long slotId;
    private LocalDateTime slotStartTime;
    private String doctorName;
}
