package com.healthcare.clinic.nursing.controller;

import com.healthcare.clinic.nursing.repository.NursePatientAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.healthcare.clinic.identity.entity.User;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest(properties = {"jwt.secret=mock-secret-key-that-is-at-least-32-chars-long-for-testing", "jwt.expirationMs=3600000", "jwt.access-token-expiration-ms=3600000", "spring.flyway.enabled=false"})
public class NursingDashboardControllerTest {

    @Autowired
    private NursingDashboardController controller;

    @MockitoBean
    private NursePatientAssignmentRepository assignmentRepository;

    @Test
    @WithMockUser(authorities = "ROLE_DOCTOR")
    public void getDashboard_AsDoctor_ShouldThrowAccessDenied() {
        User testUser = new User();
        testUser.setId(1L);
        com.healthcare.clinic.security.UserPrincipal principal = new com.healthcare.clinic.security.UserPrincipal(testUser.getId(), testUser.getEmail(), java.util.List.of(), null);
        
        assertThrows(AccessDeniedException.class, () -> controller.getMyAssignments(principal));
    }

    @Test
    @WithMockUser(authorities = "ROLE_NURSE")
    public void getDashboard_AsNurse_ShouldSucceed() {
        User testUser = new User();
        testUser.setId(1L);
        com.healthcare.clinic.security.UserPrincipal principal = new com.healthcare.clinic.security.UserPrincipal(testUser.getId(), testUser.getEmail(), java.util.List.of(), null);
        
        assertDoesNotThrow(() -> controller.getMyAssignments(principal));
    }
}
