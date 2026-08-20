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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

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
    private Branch branch;

    @BeforeEach
    void setUp() {
        Role docRole = roleRepository.findByName("ROLE_DOCTOR").orElseGet(() -> {
            Role r = new Role();
            r.setName("ROLE_DOCTOR");
            return roleRepository.save(r);
        });
        Role patRole = roleRepository.findByName("ROLE_PATIENT").orElseGet(() -> {
            Role r = new Role();
            r.setName("ROLE_PATIENT");
            return roleRepository.save(r);
        });

        doctorUser = new User();
        doctorUser.setEmail("doc_workflow@test.com");
        doctorUser.setPasswordHash("pass");
        doctorUser.setFirstName("Doc");
        doctorUser.setLastName("Test");
        doctorUser.setRoles(Set.of(docRole));
        doctorUser = userRepository.save(doctorUser);

        patientUser = new User();
        patientUser.setEmail("pat_workflow@test.com");
        patientUser.setPasswordHash("pass");
        patientUser.setFirstName("Pat");
        patientUser.setLastName("Test");
        patientUser.setRoles(Set.of(patRole));
        patientUser = userRepository.save(patientUser);

        branch = new Branch();
        branch.setName("Test Branch");
        branch.setAddress("Addr");
        branch.setCity("City");
        branch.setState("State");
        branch.setCountry("Country");
        branch.setPostalCode("00000");
        branch.setTimezone("UTC");
        
        com.healthcare.clinic.tenant.entity.Tenant tenant = new com.healthcare.clinic.tenant.entity.Tenant();
        tenant.setName("Test Tenant");
        tenant = tenantRepository.save(tenant);
        
        branch.setTenant(tenant);
        branch = branchRepository.save(branch);

        DoctorProfile docProfile = new DoctorProfile();
        docProfile.setUserId(doctorUser.getId());
        docProfile.setBranchId(branch.getId());
        docProfile.setSpecialty("General Practice");
        docProfile.setRegistrationNumber("LIC123");
        docProfile.setQualifications("MD");
        docProfile.setConsultationFee(new java.math.BigDecimal("100"));
        doctorProfileRepository.save(docProfile);

        PatientProfile patProfile = new PatientProfile();
        patProfile.setUserId(patientUser.getId());
        patProfile.setBranchId(branch.getId());
        patProfile.setDateOfBirth(LocalDate.of(1990, 1, 1));
        patProfile.setGender("Male");
        patientProfileRepository.save(patProfile);
    }

    @Test
    void testCompleteClinicalWorkflow() {
        // 1. Start Encounter
        ClinicalEncounter encounter = new ClinicalEncounter();
        encounter.setPatientId(patientProfileRepository.findByUserId(patientUser.getId()).get().getId());
        encounter.setBranchId(branch.getId());
        encounter.setChiefComplaint("Headache");
        
        ClinicalEncounter savedEncounter = encounterService.startEncounter(doctorUser.getId(), encounter);
        assertThat(savedEncounter.getId()).isNotNull();
        assertThat(savedEncounter.getStatus()).isEqualTo("In Progress");

        // 2. Add SOAP Note
        SoapNote note = new SoapNote();
        note.setSubjective("Patient complains of headache");
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
        PatientDiagnosis savedDx = diagnosisService.addDiagnosis(doctorUser, dx);
        assertThat(savedDx.getId()).isNotNull();

        // 4. Add Allergy
        PatientAllergy allergy = new PatientAllergy();
        allergy.setPatientId(savedEncounter.getPatientId());
        allergy.setAllergen("Penicillin");
        allergy.setAllergyType("Drug");
        allergy.setSeverity("Severe");
        PatientAllergy savedAllergy = allergyService.addAllergy(doctorUser, allergy);
        assertThat(savedAllergy.getId()).isNotNull();

        // 5. Finalize Encounter
        ClinicalEncounter closedEncounter = encounterService.closeEncounter(doctorUser.getId(), savedEncounter.getId());
        assertThat(closedEncounter.getStatus()).isEqualTo("CLOSED");
        assertThat(closedEncounter.getFinalizedAt()).isNotNull();

        // 6. Attempt to edit SOAP note after finalization (should fail)
        SoapNote updateNote = new SoapNote();
        updateNote.setSubjective("Trying to change");
        assertThrows(RuntimeException.class, () -> soapNoteService.saveSoapNote(doctorUser.getId(), savedEncounter.getId(), updateNote));
    }
}
