package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.identity.entity.Role;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.RoleRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.HomeVisitRequest;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.entity.TeleconsultationRequest;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PatientPortalBatch2IntegrationTest {

    @Autowired
    private HomeVisitService homeVisitService;

    @Autowired
    private TeleconsultationService teleconsultationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private BranchRepository branchRepository;

    private User testPatient;
    private Branch testBranch;

    @BeforeEach
    void setUp() {
        Role patientRole = roleRepository.findByName("ROLE_PATIENT")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName("ROLE_PATIENT");
                    return roleRepository.save(r);
                });

        testPatient = new User();
        testPatient.setEmail("testpatient_batch2@example.com");
        testPatient.setPasswordHash("password");
        testPatient.setFirstName("Test");
        testPatient.setLastName("Patient");
        testPatient.setRoles(java.util.Set.of(patientRole));
        testPatient = userRepository.save(testPatient);

        testBranch = new Branch();
        testBranch.setName("Main Branch");
        testBranch.setAddress("123 Branch St");
        testBranch.setCity("City");
        testBranch.setState("State");
        testBranch.setCountry("Country");
        testBranch.setPostalCode("12345");
        testBranch.setTimezone("UTC");
        testBranch = branchRepository.save(testBranch);

        PatientProfile profile = new PatientProfile();
        profile.setUserId(testPatient.getId());
        profile.setBranchId(testBranch.getId());
        profile.setDateOfBirth(LocalDate.of(1990, 1, 1));
        profile.setGender("Male");
        profile.setEmergencyContactName("Jane Doe");
        profile.setEmergencyContactPhone("0987654321");
        patientProfileRepository.save(profile);
    }

    @Test
    void testHomeVisitRequestWorkflow() {
        HomeVisitRequest request = new HomeVisitRequest();
        request.setAddress("123 Test St");
        request.setPreferredDate(LocalDateTime.now().plusDays(1).toLocalDate());
        request.setReasonForVisit("Nursing Care");
        
        // Create Request
        HomeVisitRequest saved = homeVisitService.requestHomeVisit(testPatient, request);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo("Requested");

        // Get Requests
        List<HomeVisitRequest> requests = homeVisitService.getPatientRequests(testPatient);
        assertThat(requests).hasSize(1);
        assertThat(requests.get(0).getReasonForVisit()).isEqualTo("Nursing Care");

        // Cancel Request
        HomeVisitRequest cancelled = homeVisitService.cancelRequest(testPatient, saved.getId());
        assertThat(cancelled.getStatus()).isEqualTo("Cancelled");
    }
    
    @Test
    void testHomeVisitCancelInvalidState() {
        HomeVisitRequest request = new HomeVisitRequest();
        request.setAddress("123 Test St");
        request.setPreferredDate(LocalDateTime.now().plusDays(1).toLocalDate());
        request.setReasonForVisit("Nursing Care");
        
        HomeVisitRequest saved = homeVisitService.requestHomeVisit(testPatient, request);
        
        // Simulate status change by admin
        saved.setStatus("En Route");
        
        assertThrows(RuntimeException.class, () -> {
            homeVisitService.cancelRequest(testPatient, saved.getId());
        });
    }

    @Test
    void testTeleconsultationRequestWorkflow() {
        TeleconsultationRequest request = new TeleconsultationRequest();
        request.setPreferredDates("Tomorrow or Friday");
        request.setPreferredTimes("After 5pm");
        request.setReason("Flu symptoms");
        request.setLanguagePreference("English");

        // Create Request
        TeleconsultationRequest saved = teleconsultationService.requestTeleconsultation(testPatient, request);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo("Requested");

        // Get Requests
        List<TeleconsultationRequest> requests = teleconsultationService.getPatientRequests(testPatient);
        assertThat(requests).hasSize(1);
        assertThat(requests.get(0).getReason()).isEqualTo("Flu symptoms");

        // Cancel Request
        TeleconsultationRequest cancelled = teleconsultationService.cancelRequest(testPatient, saved.getId());
        assertThat(cancelled.getStatus()).isEqualTo("Cancelled");
    }
}
