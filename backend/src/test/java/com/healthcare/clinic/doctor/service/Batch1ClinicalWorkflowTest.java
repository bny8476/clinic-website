package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.doctor.entity.ClinicalEncounter;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.entity.SoapNote;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.identity.entity.Role;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.RoleRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.PatientAllergy;
import com.healthcare.clinic.patient.entity.PatientDiagnosis;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.patient.service.PatientAllergyService;
import com.healthcare.clinic.patient.service.PatientDiagnosisService;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class Batch1ClinicalWorkflowTest {

    @Autowired private ClinicalEncounterService encounterService;
    @Autowired private SoapNoteService soapNoteService;
    @Autowired private PatientDiagnosisService diagnosisService;
    @Autowired private PatientAllergyService allergyService;
    
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private DoctorProfileRepository doctorProfileRepository;
    @Autowired private PatientProfileRepository patientProfileRepository;
    @Autowired private com.healthcare.clinic.tenant.repository.TenantRepository tenantRepository;

    private User doctorUser;
    private User patientUser;
    private DoctorProfile doctorProfile;
    private PatientProfile patientProfile;
    private Branch branch;

    private UserPrincipal toPrincipal(User u) {
        return u != null ? new UserPrincipal(u.getId(), u.getEmail(), u.getAuthorities(), u.getBranchId()) : null;
    }

    @BeforeEach
    void setUp() {
        branch = new Branch();
        branch.setName("Test Branch");
        branch.setAddress("123 Main St");
        branch.setCity("Test City");
        branch.setState("TS");
        branch.setCountry("USA");
        branch.setPostalCode("12345");
        branch.setPhoneNumber("+11234567890");
        branch.setEmail("branch@test.com");
        branch.setTimezone("UTC");
        branch = branchRepository.save(branch);

        Role doctorRole = roleRepository.findByName("ROLE_DOCTOR").orElseGet(() -> {
            Role r = new Role();
            r.setName("ROLE_DOCTOR");
            return roleRepository.save(r);
        });

        Role patientRole = roleRepository.findByName("ROLE_PATIENT").orElseGet(() -> {
            Role r = new Role();
            r.setName("ROLE_PATIENT");
            return roleRepository.save(r);
        });

        doctorUser = new User();
        doctorUser.setEmail("dr.john@clinic.com");
        doctorUser.setPasswordHash("hash");
        doctorUser.setFirstName("John");
        doctorUser.setLastName("Doe");
        doctorUser.setRoles(Set.of(doctorRole));
        doctorUser.setBranchId(branch.getId());
        doctorUser = userRepository.save(doctorUser);

        doctorProfile = new DoctorProfile();
        doctorProfile.setUserId(doctorUser.getId());
        doctorProfile.setSpecialty("General Practice");
        doctorProfile.setQualifications("MBBS");
        doctorProfile.setConsultationFee(new BigDecimal("50.00"));
        doctorProfile.setBranchId(branch.getId());
        doctorProfile.setRegistrationNumber("DOC12345");
        doctorProfile = doctorProfileRepository.save(doctorProfile);

        patientUser = new User();
        patientUser.setEmail("patient.jane@clinic.com");
        patientUser.setPasswordHash("hash");
        patientUser.setFirstName("Jane");
        patientUser.setLastName("Smith");
        patientUser.setRoles(Set.of(patientRole));
        patientUser.setBranchId(branch.getId());
        patientUser = userRepository.save(patientUser);

        patientProfile = new PatientProfile();
        patientProfile.setUserId(patientUser.getId());
        patientProfile.setBranchId(branch.getId());
        patientProfile.setOpNumber("MRN-9999");
        patientProfile.setDateOfBirth(LocalDate.of(1990, 1, 1));
        patientProfile.setGender("Female");
        patientProfile = patientProfileRepository.save(patientProfile);
    }

    @Test
    void testClinicalEncounterFullLifecycle() {
        // 1. Create Encounter
        ClinicalEncounter encounter = new ClinicalEncounter();
        encounter.setDoctorId(doctorProfile.getId());
        encounter.setPatientId(patientProfile.getId());
        encounter.setBranchId(branch.getId());
        encounter.setChiefComplaint("Severe headache and fever");
        ClinicalEncounter savedEncounter = encounterService.startEncounter(doctorUser.getId(), encounter);

        assertThat(savedEncounter.getId()).isNotNull();
        assertThat(savedEncounter.getStatus()).isEqualTo(com.healthcare.clinic.doctor.entity.EncounterStatus.IN_PROGRESS);

        // 2. Add SOAP Note
        SoapNote note = new SoapNote();
        note.setSubjective("Patient reports headache for 2 days");
        note.setObjective("Vitals normal");
        note.setAssessment("Tension headache");
        note.setPlan("Rest and hydration");
        SoapNote savedNote = soapNoteService.saveSoapNote(doctorUser.getId(), savedEncounter.getId(), note);
        assertThat(savedNote.getId()).isNotNull();

        // 3. Add Diagnosis
        PatientDiagnosis dx = new PatientDiagnosis();
        dx.setPatientId(savedEncounter.getPatientId());
        dx.setEncounterId(savedEncounter.getId());
        dx.setCodeSystem("ICD-10");
        dx.setCode("G44.2");
        dx.setDisplayName("Tension-type headache");
        PatientDiagnosis savedDx = diagnosisService.addDiagnosis(toPrincipal(doctorUser), dx);
        assertThat(savedDx.getId()).isNotNull();

        // 4. Add Allergy
        PatientAllergy allergy = new PatientAllergy();
        allergy.setPatientId(savedEncounter.getPatientId());
        allergy.setAllergen("Penicillin");
        allergy.setAllergyType("Drug");
        allergy.setSeverity("Severe");
        PatientAllergy savedAllergy = allergyService.addAllergy(toPrincipal(doctorUser), allergy);
        assertThat(savedAllergy.getId()).isNotNull();

        // 5. Finalize Encounter
        ClinicalEncounter closedEncounter = encounterService.closeEncounter(doctorUser.getId(), savedEncounter.getId());
        assertThat(closedEncounter.getStatus()).isEqualTo(com.healthcare.clinic.doctor.entity.EncounterStatus.CLOSED);
        assertThat(closedEncounter.getFinalizedAt()).isNotNull();

        // 6. Attempt to edit SOAP note after finalization (should fail)
        SoapNote updateNote = new SoapNote();
        updateNote.setSubjective("Trying to change");
        assertThrows(RuntimeException.class, () -> soapNoteService.saveSoapNote(doctorUser.getId(), savedEncounter.getId(), updateNote));
    }
}
