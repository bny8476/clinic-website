package com.healthcare.clinic.telemedicine.service;

import com.healthcare.clinic.telemedicine.entity.TeleconsultSession;
import com.healthcare.clinic.telemedicine.repository.TeleconsultSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * VideoProviderService - Twilio Video STUBBED (Twilio SDK removed for Render deployment).
 * Falls back to MOCK_WEB_RTC provider for all sessions.
 * Re-enable by restoring the twilio dependency and original implementation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VideoProviderService {

    private final TeleconsultSessionRepository repository;

    public TeleconsultSession createRoom(Long appointmentId, Long tenantId) {
        log.info("[STUB] VideoProviderService - Twilio removed, using MOCK_WEB_RTC. appointmentId={}", appointmentId);
        return repository.findByAppointmentId(appointmentId)
            .orElseGet(() -> {
                TeleconsultSession session = TeleconsultSession.builder()
                    .appointmentId(appointmentId)
                    .tenantId(tenantId)
                    .providerType("MOCK_WEB_RTC")
                    .roomId(UUID.randomUUID().toString())
                    .patientToken(UUID.randomUUID().toString())
                    .doctorToken(UUID.randomUUID().toString())
                    .status("WAITING")
                    .build();
                return repository.save(session);
            });
    }

    public TeleconsultSession getSessionByAppointment(Long appointmentId) {
        return repository.findByAppointmentId(appointmentId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
    }
}