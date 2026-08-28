package com.healthcare.clinic.pharmacy.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.clinic.integration.ClinicIntegrationClient;
import com.healthcare.clinic.pharmacy.entity.PharmacyOutboxEvent;
import com.healthcare.clinic.pharmacy.repository.PharmacyOutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.List;

@Service
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class PharmacyOutboxSyncWorker {

    private final PharmacyOutboxEventRepository pharmacyOutboxEventRepository;
    private final ClinicIntegrationClient clinicIntegrationClient;
    private final ObjectMapper objectMapper;

    private static final int MAX_RETRIES = 5;

    @Scheduled(fixedDelay = 5000)
    public void processOutbox() {
        try {
            List<PharmacyOutboxEvent> pendingEvents = pharmacyOutboxEventRepository.findByStatus("PENDING");
            for (PharmacyOutboxEvent event : pendingEvents) {
                try {
                    if (event.getRetryCount() != null && event.getRetryCount() > 0 && event.getProcessedAt() != null) {
                        ZonedDateTime nextRetry = event.getProcessedAt().plusSeconds(event.getRetryCount() * 30L);
                        if (ZonedDateTime.now().isBefore(nextRetry)) {
                            continue;
                        }
                    }

                    if (("PHARMACY_PRESCRIPTION".equals(event.getAggregateType()) && "STATUS_UPDATE".equals(event.getEventType())) ||
                        ("PRESCRIPTION".equals(event.getAggregateType()) && "PRESCRIPTION_DISPENSED".equals(event.getEventType()))) {
                        
                        @SuppressWarnings("unchecked")
                        java.util.Map<String, Object> payloadMap = objectMapper.readValue(event.getPayload(), java.util.Map.class);
                        Long clinicalId = Long.valueOf(payloadMap.get("clinicalPrescriptionId").toString());
                        String status = (String) payloadMap.get("status");
                        String pharmacist = (String) payloadMap.get("dispensedBy"); // Or pharmacistUsername
                        if (pharmacist == null) pharmacist = (String) payloadMap.get("pharmacistUsername");
                        
                        String dispensedAtStr = (String) payloadMap.get("dispensedAt");
                        java.time.LocalDateTime dispensedAt = dispensedAtStr != null ? java.time.LocalDateTime.parse(dispensedAtStr) : null;
                        
                        @SuppressWarnings("unchecked")
                        java.util.List<java.util.Map<String, Object>> items = (java.util.List<java.util.Map<String, Object>>) payloadMap.get("items");

                        clinicIntegrationClient.syncClinicalStatus(
                                clinicalId,
                                status,
                                pharmacist,
                                dispensedAt,
                                items);
                    }
                    
                    event.setStatus("PROCESSED");
                    event.setProcessedAt(ZonedDateTime.now());
                    event.setLastError(null);
                    pharmacyOutboxEventRepository.save(event);
                } catch (Exception e) {
                    int attempts = (event.getRetryCount() != null ? event.getRetryCount() : 0) + 1;
                    event.setRetryCount(attempts);
                    event.setLastError(e.getMessage());
                    event.setProcessedAt(ZonedDateTime.now());
                    
                    if (attempts >= MAX_RETRIES) {
                        event.setStatus("FAILED");
                        log.error("PHARMACY OUTBOX SYNC FAILED PERMANENTLY: EventID={}, Type={}, AggregateID={}, Error={}", 
                                event.getId(), event.getEventType(), event.getAggregateId(), e.getMessage(), e);
                    } else {
                        event.setStatus("PENDING");
                        log.warn("Pharmacy outbox sync failed (Attempt {}/{}). Will retry later. EventID={}, Error={}", 
                                attempts, MAX_RETRIES, event.getId(), e.getMessage());
                    }
                    pharmacyOutboxEventRepository.save(event);
                }
            }
        } catch (Exception e) {
            log.trace("Pharmacy outbox table not available or error querying pending events: {}", e.getMessage());
        }
    }
}
