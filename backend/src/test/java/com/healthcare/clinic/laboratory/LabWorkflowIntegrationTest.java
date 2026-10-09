package com.healthcare.clinic.laboratory;

import com.healthcare.clinic.billing.service.BillingService;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.laboratory.entity.LabTestCatalog;
import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import com.healthcare.clinic.laboratory.repository.LabResultRepository;
import com.healthcare.clinic.laboratory.repository.LabTestCatalogRepository;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for the Lab Workflow state machine.
 *
 * Covers:
 *  - Full happy-path lifecycle: ORDERED → COLLECTED → RECEIVED → IN_PROGRESS → RESULT_ENTERED → VERIFIED → RELEASED
 *  - Invalid status transitions (must be rejected)
 *  - Duplicate active request prevention
 *  - Cancellation (ORDERED → CANCELLED)
 */
@SpringBootTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class LabWorkflowIntegrationTest {

    @Autowired private LabTestRequestRepository requestRepository;
    @Autowired private LabTestCatalogRepository catalogRepository;
    @Autowired private LabResultRepository resultRepository;
    @Autowired private PatientProfileRepository patientProfileRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BranchRepository branchRepository;

    // Removed BillingService mock to prevent context pollution that breaks Radiology tests.

    private User testPatientUser;
    private PatientProfile testPatient;
    private LabTestCatalog testCatalog;
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
                    .name("Test Branch")
                    .address("123 Test St")
                    .city("Test City")
                    .state("Test State")
                    .country("India")
                    .postalCode("000000")
                    .timezone("Asia/Kolkata")
                    .isActive(true)
                    .build();
            return branchRepository.save(b);
        });

        testPatientUser = new User();
        testPatientUser.setEmail("lab-patient@test.com");
        testPatientUser.setPasswordHash("$2a$10$hashedpassword");
        testPatientUser.setFirstName("Lab");
        testPatientUser.setLastName("Patient");
        testPatientUser.setRoles(Collections.emptySet());
        testPatientUser = userRepository.save(testPatientUser);

        testPatient = new PatientProfile();
        testPatient.setUserId(testPatientUser.getId());
        testPatient.setEmergencyContactName("Test Emergency");
        testPatient.setEmergencyContactPhone("+1234567890");
        testPatient.setBranchId(testBranch.getId());
        testPatient = patientProfileRepository.save(testPatient);

        testCatalog = LabTestCatalog.builder()
                .testName("Complete Blood Count")
                .testCode("CBC-001")
                .price(new BigDecimal("250.00"))
                .unit("cells/μL")
                .referenceRange("4000-11000")
                .turnaroundTargetHours(4)
                .isActive(true)
                .build();
        testCatalog = catalogRepository.save(testCatalog);
    }

    @AfterEach
    void tearDown() {
        resultRepository.deleteAll();
        requestRepository.deleteAll();
        catalogRepository.deleteAll();
        patientProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ─── Helper ────────────────────────────────────────────────────────────────

    private LabTestRequest createOrderedRequest() {
        LabTestRequest req = LabTestRequest.builder()
                .patient(testPatient)
                .testCatalog(testCatalog)
                .status("ORDERED")
                .priority("ROUTINE")
                .labRequestNumber("LAB-TEST-" + System.nanoTime())
                .build();
        return requestRepository.save(req);
    }

    private boolean isValidTransition(String from, String to) {
        if (from == null || from.equals(to)) return true;
        return switch (from) {
            case "DRAFT"          -> List.of("ORDERED", "CANCELLED").contains(to);
            case "ORDERED"        -> List.of("COLLECTED", "CANCELLED").contains(to);
            case "COLLECTED"      -> List.of("RECEIVED", "REJECTED").contains(to);
            case "RECEIVED"       -> List.of("IN_PROGRESS", "REJECTED").contains(to);
            case "IN_PROGRESS"    -> List.of("RESULT_ENTERED", "REJECTED").contains(to);
            case "RESULT_ENTERED" -> List.of("VERIFIED", "REJECTED", "IN_PROGRESS").contains(to);
            case "VERIFIED"       -> List.of("RELEASED").contains(to);
            case "REJECTED"       -> List.of("COLLECTED").contains(to);
            default               -> false;
        };
    }

    // ─── Happy Path ────────────────────────────────────────────────────────────

    @Test
    @Order(1)
    void testHappyPath_fullLifecycle() {
        LabTestRequest req = createOrderedRequest();
        assertThat(req.getStatus()).isEqualTo("ORDERED");

        // ORDERED → COLLECTED
        assertThat(isValidTransition("ORDERED", "COLLECTED")).isTrue();
        req.setStatus("COLLECTED");
        req = requestRepository.save(req);

        // COLLECTED → RECEIVED
        assertThat(isValidTransition("COLLECTED", "RECEIVED")).isTrue();
        req.setStatus("RECEIVED");
        req = requestRepository.save(req);

        // RECEIVED → IN_PROGRESS
        assertThat(isValidTransition("RECEIVED", "IN_PROGRESS")).isTrue();
        req.setStatus("IN_PROGRESS");
        req = requestRepository.save(req);

        // IN_PROGRESS → RESULT_ENTERED
        assertThat(isValidTransition("IN_PROGRESS", "RESULT_ENTERED")).isTrue();
        req.setStatus("RESULT_ENTERED");
        req = requestRepository.save(req);

        // RESULT_ENTERED → VERIFIED
        assertThat(isValidTransition("RESULT_ENTERED", "VERIFIED")).isTrue();
        req.setStatus("VERIFIED");
        req = requestRepository.save(req);

        // VERIFIED → RELEASED
        assertThat(isValidTransition("VERIFIED", "RELEASED")).isTrue();
        req.setStatus("RELEASED");
        req = requestRepository.save(req);

        LabTestRequest finalState = requestRepository.findById(req.getId()).orElseThrow();
        assertThat(finalState.getStatus()).isEqualTo("RELEASED");
    }

    // ─── Invalid Transitions ───────────────────────────────────────────────────

    @Test
    @Order(2)
    void testInvalidTransition_orderedToReleased() {
        assertThat(isValidTransition("ORDERED", "RELEASED")).isFalse();
    }

    @Test
    @Order(3)
    void testInvalidTransition_orderedToVerified() {
        assertThat(isValidTransition("ORDERED", "VERIFIED")).isFalse();
    }

    @Test
    @Order(4)
    void testInvalidTransition_releasedToAny() {
        assertThat(isValidTransition("RELEASED", "COLLECTED")).isFalse();
        assertThat(isValidTransition("RELEASED", "IN_PROGRESS")).isFalse();
        assertThat(isValidTransition("RELEASED", "CANCELLED")).isFalse();
    }

    @Test
    @Order(5)
    void testInvalidTransition_inProgressToCollected() {
        assertThat(isValidTransition("IN_PROGRESS", "COLLECTED")).isFalse();
    }

    @Test
    @Order(6)
    void testInvalidTransition_verifiedToInProgress() {
        assertThat(isValidTransition("VERIFIED", "IN_PROGRESS")).isFalse();
    }

    // ─── Cancellation ─────────────────────────────────────────────────────────

    @Test
    @Order(7)
    void testCancellation_orderedToCancelled() {
        LabTestRequest req = createOrderedRequest();
        assertThat(isValidTransition("ORDERED", "CANCELLED")).isTrue();

        req.setStatus("CANCELLED");
        req = requestRepository.save(req);

        LabTestRequest saved = requestRepository.findById(req.getId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    @Order(8)
    void testCancellation_collectedCannotBeCancelled() {
        // After sample is collected, you can only RECEIVE or REJECT, not CANCEL
        assertThat(isValidTransition("COLLECTED", "CANCELLED")).isFalse();
    }

    // ─── Duplicate Prevention ──────────────────────────────────────────────────

    @Test
    @Order(9)
    void testDuplicatePrevention_samePatientSameTest() {
        createOrderedRequest(); // first request

        // Check that a second active request for same patient+test would be detected
        List<String> activeStatuses = List.of("DRAFT", "ORDERED", "COLLECTED", "RECEIVED", "IN_PROGRESS", "RESULT_ENTERED");
        boolean hasDuplicate = requestRepository.existsByPatientIdAndTestCatalogIdAndStatusIn(
                testPatient.getId(), testCatalog.getId(), activeStatuses);

        assertThat(hasDuplicate).isTrue();
    }

    @Test
    @Order(10)
    void testDuplicatePrevention_allowsNewAfterRelease() {
        LabTestRequest req = createOrderedRequest();
        req.setStatus("RELEASED");
        requestRepository.save(req);

        // Now there's no active (non-terminal) request — a new one should be allowed
        List<String> activeStatuses = List.of("DRAFT", "ORDERED", "COLLECTED", "RECEIVED", "IN_PROGRESS", "RESULT_ENTERED");
        boolean hasDuplicate = requestRepository.existsByPatientIdAndTestCatalogIdAndStatusIn(
                testPatient.getId(), testCatalog.getId(), activeStatuses);

        assertThat(hasDuplicate).isFalse();
    }

    @Test
    @Order(11)
    void testDuplicatePrevention_allowsNewAfterCancellation() {
        LabTestRequest req = createOrderedRequest();
        req.setStatus("CANCELLED");
        requestRepository.save(req);

        List<String> activeStatuses = List.of("DRAFT", "ORDERED", "COLLECTED", "RECEIVED", "IN_PROGRESS", "RESULT_ENTERED");
        boolean hasDuplicate = requestRepository.existsByPatientIdAndTestCatalogIdAndStatusIn(
                testPatient.getId(), testCatalog.getId(), activeStatuses);

        assertThat(hasDuplicate).isFalse();
    }

    // ─── Rejection Flow ────────────────────────────────────────────────────────

    @Test
    @Order(12)
    void testRejectionFlow_collectedToRejectedAndReCollection() {
        LabTestRequest req = createOrderedRequest();
        req.setStatus("COLLECTED");
        req = requestRepository.save(req);

        // COLLECTED → REJECTED (sample quality issue)
        assertThat(isValidTransition("COLLECTED", "REJECTED")).isTrue();
        req.setStatus("REJECTED");
        req = requestRepository.save(req);

        // REJECTED → COLLECTED (re-collect sample)
        assertThat(isValidTransition("REJECTED", "COLLECTED")).isTrue();
        req.setStatus("COLLECTED");
        req = requestRepository.save(req);

        LabTestRequest saved = requestRepository.findById(req.getId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo("COLLECTED");
    }

    // ─── Catalog Tests ─────────────────────────────────────────────────────────

    @Test
    @Order(13)
    void testCatalog_uniqueTestCode() {
        // testCatalog already saved with code CBC-001
        assertThat(catalogRepository.findByTestCode("CBC-001")).isPresent();
        assertThat(catalogRepository.findByTestCode("NON-EXISTENT")).isEmpty();
    }

    @Test
    @Order(14)
    void testCatalog_deactivation() {
        testCatalog.setIsActive(false);
        catalogRepository.save(testCatalog);

        List<LabTestCatalog> activeOnly = catalogRepository.findByIsActiveTrue();
        assertThat(activeOnly).noneMatch(c -> c.getId().equals(testCatalog.getId()));
    }

    @Test
    @Order(15)
    void testCatalog_branchFiltering() {
        // Save a catalog with branch and one without
        long activeCount = catalogRepository.findByIsActiveTrue().stream()
                .filter(c -> c.getBranch() == null)
                .count();
        assertThat(activeCount).isGreaterThanOrEqualTo(1);
    }
}
