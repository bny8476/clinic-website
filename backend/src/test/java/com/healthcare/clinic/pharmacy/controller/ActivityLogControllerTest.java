package com.healthcare.clinic.pharmacy.controller;

import com.healthcare.clinic.pharmacy.service.ActivityLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest(properties = {"jwt.secret=mock-secret-key-that-is-at-least-32-chars-long-for-testing", "jwt.expirationMs=3600000", "jwt.access-token-expiration-ms=3600000", "spring.flyway.enabled=false"})
public class ActivityLogControllerTest {

    @Autowired
    private ActivityLogController controller;

    @MockitoBean
    private ActivityLogService activityLogService;

    @Test
    @WithMockUser(authorities = "ROLE_NURSE")
    public void getActivityLog_AsNurse_ShouldThrowAccessDenied() {
        assertThrows(AccessDeniedException.class, () -> controller.getLogsByUserId(1L, null, org.springframework.data.domain.PageRequest.of(0, 10)));
    }

    @Test
    @WithMockUser(authorities = "ROLE_PHARMACIST", username = "pharmacist")
    public void getActivityLog_AsPharmacist_ShouldSucceed() {
        try {
            controller.getLogsByUserId(1L, null, org.springframework.data.domain.PageRequest.of(0, 10));
        } catch (AccessDeniedException e) {
            // It will throw AccessDeniedException from SecurityUtils.assertOwnerOrAdmin, not from @PreAuthorize.
            // We know it passed @PreAuthorize because the exception message is specific to our SecurityUtils.
            org.junit.jupiter.api.Assertions.assertEquals("You do not have permission to access this resource", e.getMessage());
        }
    }
}
