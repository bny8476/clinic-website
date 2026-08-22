package com.healthcare.clinic.pharmacy.controller;

import com.healthcare.clinic.pharmacy.service.AnalyticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest(properties = {"jwt.secret=mock-secret-key-that-is-at-least-32-chars-long-for-testing", "jwt.expirationMs=3600000", "jwt.access-token-expiration-ms=3600000", "spring.flyway.enabled=false"})
public class AnalyticsControllerTest {

    @Autowired
    private AnalyticsController controller;

    @MockitoBean
    private AnalyticsService analyticsService;

    @Test
    @WithMockUser(authorities = "ROLE_NURSE")
    public void getAnalytics_AsNurse_ShouldThrowAccessDenied() {
        assertThrows(AccessDeniedException.class, () -> controller.getDashboardSummary(null, null));
    }

    @Test
    @WithMockUser(authorities = "ROLE_PHARMACIST")
    public void getAnalytics_AsPharmacist_ShouldSucceed() {
        assertDoesNotThrow(() -> controller.getDashboardSummary(java.time.Instant.now(), java.time.Instant.now()));
    }
}
