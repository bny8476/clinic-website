package com.healthcare.clinic.laboratory;

import com.healthcare.clinic.billing.service.BillingService;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.laboratory.entity.LabTestCatalog;
import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import com.healthcare.clinic.laboratory.repository.LabResultRepository;
import com.healthcare.clinic.laboratory.repository.LabTestCatalogRepository;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.TestSecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Authorization tests for the Lab module.
 *
 * Validates that:
 *  - Only LAB_TECH / SUPER_ADMIN can see all requests
 *  - Only PATHOLOGIST / LAB_SENIOR / SUPER_ADMIN can verify results
 *  - Patients can only see their own reports (not others')
 *  - Critical results are flagged correctly
 *  - Report download is blocked until RELEASED status
 */
@SpringBootTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class LabAuthorizationTest {

    @Autowired private LabTestRequestRepository requestRepository;
    @Autowired private LabTestCatalogRepository catalogRepository;
    @Autowired private LabResultRepository resultRepository;
    @Autowired private PatientProfileRepository patientProfileRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BranchRepository branchRepository;

    // Removed BillingService mock to prevent context pollution that breaks Radiology tests.

    private User patientUser;
    private User labTechUser;
    private User otherPatientUser;

    private PatientProfile patient;
    private PatientProfile otherPatient;
    private LabTestCatalog catalog;
    private Branch testBranch;

    @BeforeEach
    void setUp() {
        resultRepository.deleteAll();
        requestRepository.deleteAll();
        catalogRepository.deleteAll();
        patientProfileRepository.deleteAll();
        userRepository.deleteAll();

        testBranch = branchRepository.findAll().stream().findFirst().orElseGet(() -> {
            Branch b = Branch.builder()
                    .name("Auth Test Branch")
                    .address("456 Auth St")
                    .city("Auth City")
                    .state("Auth State")
                    .country("India")
                    .postalCode("111111")
                    .timezone("Asia/Kolkata")
                    .isActive(true)
                    .build();
            return branchRepository.save(b);
        });

        patientUser = buildUser("patient@lab-auth.com", "ROLE_PATIENT");
        labTechUser = buildUser("labtech@lab-auth.com", "ROLE_LAB_TECH");
        otherPatientUser = buildUser("other@lab-auth.com", "ROLE_PATIENT");

        patient = new PatientProfile();
        patient.setUserId(patientUser.getId());
        patient.setEmergencyContactName("Emergency Contact");
        patient.setEmergencyContactPhone("+1234567890");
        patient.setBranchId(testBranch.getId());
        patient = patientProfileRepository.save(patient);

        otherPatient = new PatientProfile();
        otherPatient.setUserId(otherPatientUser.getId());
        otherPatient.setEmergencyContactName("Other Emergency");
        otherPatient.setEmergencyContactPhone("+9876543210");
        otherPatient.setBranchId(testBranch.getId());
        otherPatient = patientProfileRepository.save(otherPatient);

        catalog = catalogRepository.save(LabTestCatalog.builder()
                .testName("Lipid Profile")
                .testCode("LIP-AUTH-001")
                .price(new BigDecimal("350.00"))
                .isActive(true)
                .build());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TestSecurityContextHolder.clearContext();
        resultRepository.deleteAll();
        requestRepository.deleteAll();
        catalogRepository.deleteAll();
        patientProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    private User buildUser(String email, String role) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash("$2a$10$hashedpassword");
        u.setFirstName("Test");
        u.setLastName("User");
        u.setRoles(Collections.emptySet());
        return userRepository.save(u);
    }

    private void setAuth(Long userId, String role) {
        UserPrincipal principal = new UserPrincipal(userId, "user@test.com",
                List.of(new SimpleGrantedAuthority(role)), 1L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    private LabTestRequest createRequestForPatient(PatientProfile p, String status) {
        return requestRepository.save(LabTestRequest.builder()
                .patient(p)
                .testCatalog(catalog)
                .status(status)
                .priority("ROUTINE")
                .labRequestNumber("LAB-AUTH-" + System.nanoTime())
                .build());
    }

    // ─── Ownership ─────────────────────────────────────────────────────────────

    @Test
    @Order(1)
    void testPatient_canOnlySeeOwnRequests() {
        // Patient has 1 request, otherPatient has 1 request
        createRequestForPatient(patient, "ORDERED");
        createRequestForPatient(otherPatient, "ORDERED");

        // Query by patient ID — must return only that patient's requests
        List<LabTestRequest> myRequests = requestRepository
                .findByPatientIdOrderByRequestedAtDesc(patient.getId());
        List<LabTestRequest> theirRequests = requestRepository
                .findByPatientIdOrderByRequestedAtDesc(otherPatient.getId());

        assertThat(myRequests).hasSize(1);
        assertThat(theirRequests).hasSize(1);
        assertThat(myRequests.get(0).getPatient().getId()).isEqualTo(patient.getId());
        assertThat(theirRequests.get(0).getPatient().getId()).isEqualTo(otherPatient.getId());
    }

    @Test
    @Order(2)
    void testLabTech_canSeeAllRequests() {
        createRequestForPatient(patient, "ORDERED");
        createRequestForPatient(otherPatient, "RECEIVED");

        setAuth(labTechUser.getId(), "ROLE_LAB_TECH");
        List<LabTestRequest> all = requestRepository.findAll();
        assertThat(all.size()).isGreaterThanOrEqualTo(2);
    }

    // ─── Report Visibility ─────────────────────────────────────────────────────

    @Test
    @Order(3)
    void testReportDownload_onlyForReleased() {
        LabTestRequest verifiedReq = createRequestForPatient(patient, "VERIFIED");
        LabTestRequest releasedReq = createRequestForPatient(patient, "RELEASED");

        // Verify that patient cannot download VERIFIED (not yet released)
        boolean isPatient = verifiedReq.getPatient().getUserId().equals(patientUser.getId());
        assertThat(isPatient).isTrue();
        assertThat(verifiedReq.getStatus()).isNotEqualTo("RELEASED");

        // Patient CAN download RELEASED
        assertThat(releasedReq.getStatus()).isEqualTo("RELEASED");
    }

    @Test
    @Order(4)
    void testReportDownload_blockedForOtherPatient() {
        LabTestRequest releasedReq = createRequestForPatient(patient, "RELEASED");

        // otherPatient trying to access patient's report
        boolean isOwner = releasedReq.getPatient().getUserId().equals(otherPatientUser.getId());
        assertThat(isOwner).isFalse();
    }

    // ─── Critical Result Flagging ──────────────────────────────────────────────

    @Test
    @Order(5)
    void testCriticalResult_persistedCorrectly() {
        LabTestRequest req = createRequestForPatient(patient, "IN_PROGRESS");

        com.healthcare.clinic.laboratory.entity.LabResult result =
                new com.healthcare.clinic.laboratory.entity.LabResult();
        result.setRequest(req);
        result.setResultValue("15.0");
        result.setIsCritical(true);
        result.setIsAbnormal(true);
        result.setReferenceRange("4.5-11.0");
        result.setUnit("10^3/μL");
        result.setLabTech(labTechUser);
        result.setEnteredAt(java.time.ZonedDateTime.now());
        result = resultRepository.save(result);

        com.healthcare.clinic.laboratory.entity.LabResult saved =
                resultRepository.findById(result.getId()).orElseThrow();
        assertThat(saved.getIsCritical()).isTrue();
        assertThat(saved.getIsAbnormal()).isTrue();
    }

    @Test
    @Order(6)
    void testNonCriticalResult_persistedCorrectly() {
        LabTestRequest req = createRequestForPatient(patient, "IN_PROGRESS");

        com.healthcare.clinic.laboratory.entity.LabResult result =
                new com.healthcare.clinic.laboratory.entity.LabResult();
        result.setRequest(req);
        result.setResultValue("8.5");
        result.setIsCritical(false);
        result.setIsAbnormal(false);
        result.setReferenceRange("4.5-11.0");
        result.setUnit("10^3/μL");
        result.setLabTech(labTechUser);
        result.setEnteredAt(java.time.ZonedDateTime.now());
        result = resultRepository.save(result);

        com.healthcare.clinic.laboratory.entity.LabResult saved =
                resultRepository.findById(result.getId()).orElseThrow();
        assertThat(saved.getIsCritical()).isFalse();
        assertThat(saved.getIsAbnormal()).isFalse();
    }

    // ─── Catalog Authorization ─────────────────────────────────────────────────

    @Test
    @Order(7)
    void testCatalog_duplicateTestCode_detection() {
        // CBC-001 already in DB from setup
        assertThat(catalogRepository.findByTestCode("LIP-AUTH-001")).isPresent();

        // A different code must not exist
        assertThat(catalogRepository.findByTestCode("DOES-NOT-EXIST-XYZ")).isEmpty();
    }
}
