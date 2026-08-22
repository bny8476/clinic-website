package com.healthcare.clinic.doctor.controller;

import com.healthcare.clinic.doctor.dto.PrescriptionResponse;
import com.healthcare.clinic.doctor.service.PrescriptionService;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.TestSecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest(properties = {
                    "jwt.secret=mock-secret-key-that-is-at-least-32-chars-long-for-testing", 
    "jwt.expirationMs=3600000", 
    "jwt.access-token-expiration-ms=3600000", 
        "spring.flyway.enabled=false"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class PrescriptionControllerTest {

    @Autowired
    private PrescriptionController controller;

    @MockitoBean
    private PrescriptionService prescriptionService;

    @BeforeEach
    public void setup() {
        PrescriptionResponse response = PrescriptionResponse.builder().id(1L).patientId(5L).build();
        when(prescriptionService.getPrescriptionById(1L)).thenReturn(response);
    }

    @AfterEach
    public void cleanup() {
        SecurityContextHolder.clearContext();
        TestSecurityContextHolder.clearContext();
    }

    private void setupSecurityContext(Long userId, String role) {
        UserPrincipal principal = new UserPrincipal(userId, "username", List.of(new SimpleGrantedAuthority(role)), 1L);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        
        org.springframework.security.core.context.SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        
        SecurityContextHolder.setContext(context);
        TestSecurityContextHolder.setContext(context);
    }

    @Test
    public void getPrescription_AsOwningPatient_ShouldSucceed() {
        setupSecurityContext(5L, "ROLE_PATIENT");
        assertDoesNotThrow(() -> controller.getPrescription(1L));
    }

    @Test
    public void getPrescription_AsOtherPatient_ShouldThrowAccessDenied() {
        setupSecurityContext(6L, "ROLE_PATIENT");
        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> controller.getPrescription(1L));
    }

    @Test
    public void getPrescription_AsDoctor_ShouldSucceed() {
        setupSecurityContext(10L, "ROLE_DOCTOR");
        assertDoesNotThrow(() -> controller.getPrescription(1L));
    }

    @Test
    public void getPrescription_AsAdmin_ShouldSucceed() {
        setupSecurityContext(99L, "ROLE_ADMIN");
        assertDoesNotThrow(() -> controller.getPrescription(1L));
    }
}
