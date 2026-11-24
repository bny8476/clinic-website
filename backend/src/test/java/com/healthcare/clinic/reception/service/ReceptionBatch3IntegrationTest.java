package com.healthcare.clinic.reception.service;

import com.healthcare.clinic.reception.entity.ClinicBill;
import com.healthcare.clinic.reception.entity.ClinicPayment;
import com.healthcare.clinic.reception.entity.InsuranceVerification;
import com.healthcare.clinic.reception.repository.ClinicBillRepository;
import com.healthcare.clinic.reception.repository.ClinicPaymentRepository;
import com.healthcare.clinic.reception.repository.InsuranceVerificationRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReceptionBatch3IntegrationTest {

    @Autowired
    private ClinicBillingService billingService;

    @Autowired
    private InsuranceVerificationService insuranceService;

    @Autowired
    private ClinicBillRepository billRepository;

    @Autowired
    private ClinicPaymentRepository paymentRepository;

    @Autowired
    private InsuranceVerificationRepository insuranceRepository;

    @Autowired
    private UserRepository userRepository;

    private User testPatient;
    private User testReceptionist;

    @BeforeEach
    void setUp() {
        String suffix = "_" + System.nanoTime();
        testPatient = new User();
        testPatient.setEmail("patient3" + suffix + "@test.com");
        testPatient.setFirstName("Jane");
        testPatient.setLastName("Smith");
        testPatient.setPasswordHash("hash");
        testPatient = userRepository.save(testPatient);

        testReceptionist = new User();
        testReceptionist.setEmail("reception3" + suffix + "@test.com");
        testReceptionist.setFirstName("Rec");
        testReceptionist.setLastName("Three");
        testReceptionist.setPasswordHash("hash");
        testReceptionist = userRepository.save(testReceptionist);
    }

    @Test
    void shouldCreateBillAndRecordPayment() {
        List<Map<String, Object>> items = List.of(
                Map.of("description", "Consultation", "amount", 100.0, "department", "GENERAL"),
                Map.of("description", "Vitals Check", "amount", 20.0, "department", "NURSING")
        );

        ClinicBill bill = billingService.createBill(testPatient.getId(), null, null, items);
        
        assertThat(bill).isNotNull();
        assertThat(bill.getId()).isNotNull();
        assertThat(bill.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(120.0));
        assertThat(bill.getStatus()).isEqualTo("PENDING");

        ClinicPayment payment = billingService.recordPayment(bill.getId(), BigDecimal.valueOf(120.0), "CARD", "TXN123");
        
        assertThat(payment).isNotNull();
        assertThat(payment.getStatus()).isEqualTo("COMPLETED");

        ClinicBill updatedBill = billRepository.findById(bill.getId()).orElseThrow();
        assertThat(updatedBill.getStatus()).isEqualTo("PAID");
    }

    @Test
    void shouldRequestAndVerifyInsurance() {
        InsuranceVerification verification = insuranceService.requestVerification(testPatient.getId(), "BlueCross", "POL-123");
        
        assertThat(verification).isNotNull();
        assertThat(verification.getStatus()).isEqualTo("PENDING");

        InsuranceVerification verified = insuranceService.verifyInsurance(verification.getId(), "VERIFIED", "Coverage: 80%");
        
        assertThat(verified.getStatus()).isEqualTo("VERIFIED");
        assertThat(verified.getCoverageDetails()).isEqualTo("Coverage: 80%");
    }
}
