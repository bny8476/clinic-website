package com.healthcare.clinic.reception.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.reception.dto.IdentityVerificationRequest;
import com.healthcare.clinic.reception.dto.IdentityVerificationResponse;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ReceptionBatch1IntegrationTest {

    @Autowired
    private ReceptionPatientService patientService;

    @Autowired
    private IdentityVerificationService identityVerificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    private User testReceptionist;
    private User testPatientUser;
    private PatientProfile testPatientProfile;

    @BeforeEach
    void setUp() {
        String suffix = "_" + System.nanoTime();
        // Create receptionist
        testReceptionist = new User();
        testReceptionist.setEmail("reception" + suffix + "@test.com");
        testReceptionist.setFirstName("Rec");
        testReceptionist.setLastName("Eption");
        testReceptionist.setPasswordHash("hash");
        testReceptionist.setBranchId(1L);
        testReceptionist = userRepository.save(testReceptionist);

        // Create patient user
        testPatientUser = new User();
        testPatientUser.setEmail("patient.rec" + suffix + "@test.com");
        testPatientUser.setFirstName("RecBatchOneJohn");
        testPatientUser.setLastName("Doe");
        testPatientUser.setPhoneNumber("+1987654321");
        testPatientUser.setPasswordHash("hash");
        testPatientUser.setBranchId(1L);
        testPatientUser = userRepository.save(testPatientUser);

        // Create patient profile
        testPatientProfile = new PatientProfile();
        testPatientProfile.setUserId(testPatientUser.getId());
        testPatientProfile.setBranchId(1L);
        testPatientProfile.setOpNumber("OP-2026-001");
        testPatientProfile.setDateOfBirth(LocalDate.of(1990, 1, 1));
        testPatientProfile.setGender("Male");
        testPatientProfile = patientProfileRepository.save(testPatientProfile);

        UserPrincipal principal = new UserPrincipal(
                testReceptionist.getId(),
                testReceptionist.getEmail(),
                List.of(new SimpleGrantedAuthority("ROLE_RECEPTION")),
                testReceptionist.getBranchId()
        );

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "password", principal.getAuthorities())
        );
    }

    @Test
    void testSearchPatients() {
        List<Map<String, Object>> byName = patientService.searchPatients("RecBatchOneJohn", null);
        assertThat(byName).hasSize(1);
        assertThat(byName.get(0).get("opNumber")).isEqualTo("OP-2026-001");

        List<Map<String, Object>> byPhone = patientService.searchPatients("98765", null);
        assertThat(byPhone).hasSize(1);

        List<Map<String, Object>> byOp = patientService.searchPatients(null, "OP-2026-001");
        assertThat(byOp).hasSize(1);
        
        List<Map<String, Object>> noMatch = patientService.searchPatients("NonExistent", null);
        assertThat(noMatch).isEmpty();
    }

    @Test
    void testIdentityVerification() {
        IdentityVerificationRequest request = IdentityVerificationRequest.builder()
                .patientId(testPatientProfile.getId())
                .verificationMethod("GOVERNMENT_ID")
                .documentReference("DOC-12345")
                .build();

        IdentityVerificationResponse response = identityVerificationService.verifyIdentity(request);
        assertThat(response.getId()).isNotNull();
        assertThat(response.getStatus()).isEqualTo("SUCCESS");
        assertThat(response.getVerifiedByUserId()).isEqualTo(testReceptionist.getId());

        List<IdentityVerificationResponse> verifications = identityVerificationService.getVerificationsForPatient(testPatientProfile.getId());
        assertThat(verifications).hasSize(1);
        assertThat(verifications.get(0).getVerificationMethod()).isEqualTo("GOVERNMENT_ID");
    }
}
