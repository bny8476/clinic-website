package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.ConsentVersion;
import com.healthcare.clinic.patient.entity.DependentProfile;
import com.healthcare.clinic.patient.entity.PatientConsent;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.ConsentVersionRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PatientSettingsIntegrationTest {

    @Autowired
    private PatientSettingsService patientSettingsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private ConsentVersionRepository consentVersionRepository;

    @Test
    void shouldAddAndRetrieveDependents() {
        User user = new User();
        user.setEmail("testpatient_dep@example.com");
        user.setPasswordHash("hash");
        user.setFirstName("First");
        user.setLastName("Last");
        user = userRepository.save(user);

        PatientProfile profile = new PatientProfile();
        profile.setUserId(user.getId());
        profile.setBranchId(1L);
        profile = patientProfileRepository.save(profile);

        DependentProfile dependent = new DependentProfile();
        dependent.setFirstName("Timmy");
        dependent.setLastName("Test");
        dependent.setRelationship("Child");
        dependent.setDateOfBirth(LocalDate.of(2015, 1, 1));
        
        DependentProfile saved = patientSettingsService.addDependent(user.getId(), dependent);
        assertThat(saved.getId()).isNotNull();

        List<DependentProfile> dependents = patientSettingsService.getDependents(user.getId());
        assertThat(dependents).hasSize(1);
        assertThat(dependents.get(0).getFirstName()).isEqualTo("Timmy");
    }

    @Test
    void shouldGrantConsent() {
        User user = new User();
        user.setEmail("testpatient_consent@example.com");
        user.setPasswordHash("hash");
        user.setFirstName("Test");
        user.setLastName("User");
        user = userRepository.save(user);

        PatientProfile profile = new PatientProfile();
        profile.setUserId(user.getId());
        profile.setBranchId(1L);
        profile = patientProfileRepository.save(profile);

        ConsentVersion cv = new ConsentVersion();
        cv.setConsentType("TEST_CONSENT");
        cv.setVersionId("v1.0.0");
        cv.setDocumentText("Test document");
        cv.setIsLatest(true);
        consentVersionRepository.save(cv);

        PatientConsent consent = patientSettingsService.grantConsent(user.getId(), "TEST_CONSENT", "127.0.0.1", "TestAgent");
        assertThat(consent.getId()).isNotNull();
        assertThat(consent.getIsGranted()).isTrue();
        assertThat(consent.getIpAddress()).isEqualTo("127.0.0.1");

        List<PatientConsent> consents = patientSettingsService.getPatientConsents(user.getId());
        assertThat(consents).hasSize(1);
    }
}
