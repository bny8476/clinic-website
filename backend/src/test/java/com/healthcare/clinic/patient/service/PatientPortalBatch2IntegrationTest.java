package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.HomeVisitRequest;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.entity.TeleconsultationRequest;
import com.healthcare.clinic.homevisit.repository.HomeVisitRequestRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.patient.repository.TeleconsultationRequestRepository;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
public class PatientPortalBatch2IntegrationTest {

    @Autowired
    private HomeVisitService homeVisitService;

    @Autowired
    private TeleconsultationService teleconsultationService;

    @Autowired
    private HomeVisitRequestRepository homeVisitRequestRepository;

    @Autowired
    private TeleconsultationRequestRepository teleconsultationRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    private User testPatient;
    private PatientProfile profile;

    private UserPrincipal toPrincipal(User u) {
        return u != null ? new UserPrincipal(u.getId(), u.getEmail(), u.getAuthorities(), u.getBranchId()) : null;
    }

    @BeforeEach
    void setUp() {
        testPatient = new User();
        testPatient.setEmail("batch2patient@example.com");
        testPatient.setPasswordHash("hash");
        testPatient.setFirstName("Jane");
        testPatient.setLastName("Doe");
        testPatient.setBranchId(1L);
        userRepository.save(testPatient);

        profile = new PatientProfile();
        profile.setUserId(testPatient.getId());
        profile.setBranchId(1L);
        profile.setGender("Female");
        profile.setAddress("123 Test St");
        patientProfileRepository.save(profile);
    }

    @Test
    void testHomeVisitRequestWorkflow() {
        HomeVisitRequest request = new HomeVisitRequest();
        request.setAddress("123 Test St");
        request.setPreferredDate(LocalDateTime.now().plusDays(1).toLocalDate());
        request.setReasonForVisit("Nursing Care");
        
        // Create Request
        HomeVisitRequest saved = homeVisitService.requestHomeVisit(toPrincipal(testPatient), request);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo("Requested");

        // Get Requests
        List<HomeVisitRequest> requests = homeVisitService.getPatientRequests(toPrincipal(testPatient));
        assertThat(requests).hasSize(1);
        assertThat(requests.get(0).getReasonForVisit()).isEqualTo("Nursing Care");

        // Cancel Request
        HomeVisitRequest cancelled = homeVisitService.cancelRequest(toPrincipal(testPatient), saved.getId());
        assertThat(cancelled.getStatus()).isEqualTo("Cancelled");
    }
    
    @Test
    void testHomeVisitCancelInvalidState() {
        HomeVisitRequest request = new HomeVisitRequest();
        request.setAddress("123 Test St");
        request.setPreferredDate(LocalDateTime.now().plusDays(1).toLocalDate());
        request.setReasonForVisit("Nursing Care");
        
        HomeVisitRequest saved = homeVisitService.requestHomeVisit(toPrincipal(testPatient), request);
        
        // Simulate status change by admin
        saved.setStatus("En Route");
        
        assertThrows(RuntimeException.class, () -> {
            homeVisitService.cancelRequest(toPrincipal(testPatient), saved.getId());
        });
    }

    @Test
    void testTeleconsultationRequestWorkflow() {
        TeleconsultationRequest request = new TeleconsultationRequest();
        request.setPreferredDates("Tomorrow or Friday");
        request.setPreferredTimes("After 5pm");
        request.setReason("Flu symptoms");
        request.setLanguagePreference("English");

        TeleconsultationRequest saved = teleconsultationService.requestTeleconsultation(testPatient, request);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo("Requested");

        List<TeleconsultationRequest> requests = teleconsultationService.getPatientRequests(testPatient);
        assertThat(requests).hasSize(1);
    }
}
