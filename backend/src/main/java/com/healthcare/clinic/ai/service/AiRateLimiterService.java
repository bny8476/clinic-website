package com.healthcare.clinic.ai.service;

import com.healthcare.clinic.ai.config.GroqConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiRateLimiterService {

    private final GroqConfig groqConfig;

    // In-memory sliding window timestamps: key -> list of timestamp Epoch Seconds
    private final Map<String, List<Long>> requestHistory = new ConcurrentHashMap<>();

    public boolean isAllowed(Long userId, String clientIp) {
        String key;
        int limit;

        if (userId != null) {
            key = "user:" + userId;
            limit = groqConfig.getRateLimitAuthenticated();
        } else {
            key = "ip:" + (clientIp != null ? clientIp : "unknown");
            limit = groqConfig.getRateLimitAnonymous();
        }

        long now = Instant.now().getEpochSecond();
        long windowStart = now - ChronoUnit.HOURS.getDuration().getSeconds();

        List<Long> timestamps = requestHistory.computeIfAbsent(key, k -> new ArrayList<>());

        synchronized (timestamps) {
            // Remove timestamps older than 1 hour
            timestamps.removeIf(ts -> ts < windowStart);

            if (timestamps.size() >= limit) {
                log.warn("Rate limit exceeded for key {}: {} requests in 1 hour (limit: {})", key, timestamps.size(), limit);
                return false;
            }

            timestamps.add(now);
            return true;
        }
    }
}
