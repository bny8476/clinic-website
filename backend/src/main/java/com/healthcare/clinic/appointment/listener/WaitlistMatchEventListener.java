package com.healthcare.clinic.appointment.listener;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.clinic.appointment.event.WaitlistMatchEvent;
import com.healthcare.clinic.doctor.entity.ClinicOutboxEvent;
import com.healthcare.clinic.doctor.repository.ClinicOutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WaitlistMatchEventListener {

    private final ClinicOutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @EventListener
    public void onWaitlistMatch(WaitlistMatchEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "waitlistEntryId", event.getWaitlistEntryId(),
                    "patientUserId", event.getPatientUserId(),
                    "doctorUserId", event.getDoctorUserId(),
                    "slotId", event.getSlotId(),
                    "startTime", event.getSlotStartTime().toString(),
                    "doctorName", event.getDoctorName()
            ));

            ClinicOutboxEvent outboxEvent = ClinicOutboxEvent.builder()
                    .aggregateType("Waitlist")
                    .aggregateId(String.valueOf(event.getWaitlistEntryId()))
                    .eventType("WaitlistMatchNotification")
                    .payload(payload)
                    .status("PENDING")
                    .build();

            outboxEventRepository.save(outboxEvent);
            log.info("Saved outbox event for WaitlistMatchNotification for entry {}", event.getWaitlistEntryId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize WaitlistMatchEvent", e);
        }
    }
}
