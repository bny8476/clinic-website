package com.healthcare.clinic.inventory.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Keep-alive service for production deployments.
 */
@Service("pharmacyKeepAliveService")
public class KeepAliveService {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveService.class);

    @Value("${app.url:http://localhost:5173}")
    private String appUrl;

    @Value("${RAILWAY_STATIC_URL:}")
    private String railwayStaticUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Pings /actuator/health every 10 minutes (600,000 ms).
     */
    @Scheduled(fixedRate = 600_000)
    public void keepAlive() {
        String baseUrl = resolveBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            log.debug("Keep-alive: no external URL configured, skipping ping.");
            return;
        }

        String healthUrl = baseUrl + "/actuator/health";
        try {
            String response = restTemplate.getForObject(healthUrl, String.class);
            log.debug("Keep-alive ping OK → {} | response: {}", healthUrl, response);
        } catch (Exception e) {
            log.warn("Keep-alive ping failed → {}: {}", healthUrl, e.getMessage());
        }
    }

    private String resolveBaseUrl() {
        if (railwayStaticUrl != null && !railwayStaticUrl.isBlank()) {
            return railwayStaticUrl.startsWith("http") ? railwayStaticUrl : "https://" + railwayStaticUrl;
        }
        if (appUrl != null && appUrl.startsWith("https://")) {
            return appUrl;
        }
        return null;
    }
}
