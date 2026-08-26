package com.healthcare.clinic.appointment.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@Slf4j
public class AppointmentHoldService {

    private final Cache<String, String> cache;
    private static final Duration HOLD_DURATION = Duration.ofMinutes(3);

    public AppointmentHoldService() {
        this.cache = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofHours(24))
                .maximumSize(10000)
                .build();
    }

    public String holdSlot(Long doctorId, String slotStart) {
        String key = "slot-hold:" + doctorId + ":" + slotStart;
        String holdId = UUID.randomUUID().toString();

        String existing = cache.asMap().putIfAbsent(key, holdId);
        
        if (existing == null) {
            log.info("Acquired hold {} for doctor {} at {}", holdId, doctorId, slotStart);
            return holdId;
        } else {
            log.warn("Failed to acquire hold for doctor {} at {}", doctorId, slotStart);
            return null; // Indicates slot is already held
        }
    }

    public boolean validateHold(Long doctorId, String slotStart, String holdId) {
        if (holdId == null) return false;
        String key = "slot-hold:" + doctorId + ":" + slotStart;
        String existingHoldId = cache.getIfPresent(key);
        return holdId.equals(existingHoldId);
    }

    public void releaseHold(Long doctorId, String slotStart, String holdId) {
        if (holdId == null) return;
        String key = "slot-hold:" + doctorId + ":" + slotStart;
        String existingHoldId = cache.getIfPresent(key);
        
        if (holdId.equals(existingHoldId)) {
            cache.invalidate(key);
            log.info("Released hold {} for doctor {} at {}", holdId, doctorId, slotStart);
        }
    }

    public boolean isHeld(Long doctorId, String slotStart) {
        String key = "slot-hold:" + doctorId + ":" + slotStart;
        return cache.getIfPresent(key) != null;
    }

    public boolean isIdempotencyKeyProcessed(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isEmpty()) return false;
        return cache.getIfPresent("idemp:" + idempotencyKey) != null;
    }

    public Long getAppointmentIdForIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isEmpty()) return null;
        String val = cache.getIfPresent("idemp:" + idempotencyKey);
        if (val != null) {
            return Long.parseLong(val);
        }
        return null;
    }

    public void saveIdempotencyKey(String idempotencyKey, Long appointmentId) {
        if (idempotencyKey == null || idempotencyKey.isEmpty()) return;
        cache.put("idemp:" + idempotencyKey, String.valueOf(appointmentId));
    }
}
