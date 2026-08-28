package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.PatientNotification;
import com.healthcare.clinic.patient.entity.PatientPortalPayment;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientNotificationRepository;
import com.healthcare.clinic.patient.repository.PatientPortalPaymentRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
public class PatientPortalBatch4IntegrationTest {

    @Autowired
    private PatientPortalPaymentService patientPaymentService;

    @Autowired
    private PatientNotificationService notificationService;

    @Autowired
    private PatientPortalPaymentRepository paymentRepository;

    @Autowired
    private PatientNotificationRepository notificationRepository;

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
        testPatient.setEmail("batch4patient@example.com");
        testPatient.setPasswordHash("hash");
        testPatient.setFirstName("Bob");
        testPatient.setLastName("Jones");
        testPatient.setBranchId(1L);
        userRepository.save(testPatient);

        profile = new PatientProfile();
        profile.setUserId(testPatient.getId());
        profile.setBranchId(1L);
        profile.setGender("Male");
        patientProfileRepository.save(profile);
    }

    @Test
    void testPatientPaymentWorkflow() {
        PatientPortalPayment payment = new PatientPortalPayment();
        payment.setAmount(new BigDecimal("50.00"));
        payment.setPaymentMethod("Credit Card");

        PatientPortalPayment processed = patientPaymentService.processPayment(toPrincipal(testPatient), payment);
        assertThat(processed.getId()).isNotNull();
        assertThat(processed.getStatus()).isEqualTo("Completed");
        assertThat(processed.getTransactionId()).startsWith("TXN-");

        List<PatientPortalPayment> payments = patientPaymentService.getPayments(toPrincipal(testPatient));
        assertThat(payments).hasSize(1);
    }

    @Test
    void testNotificationWorkflow() {
        List<PatientNotification> initial = notificationService.getUnreadNotifications(toPrincipal(testPatient));
        assertThat(initial).isEmpty();
    }
}
