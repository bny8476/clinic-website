package com.healthcare.clinic.laboratory.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.laboratory.entity.LabResult;
import com.healthcare.clinic.laboratory.entity.LabTestCatalog;
import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import com.healthcare.clinic.laboratory.repository.LabResultRepository;
import com.healthcare.clinic.laboratory.repository.LabTestCatalogRepository;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
public class LabBatch2IntegrationTest {

    @Autowired
    private LabResultService resultService;

    @Autowired
    private LabTestRequestRepository requestRepository;

    @Autowired
    private LabTestCatalogRepository catalogRepository;

    @Autowired
    private LabResultRepository resultRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private BranchRepository branchRepository;

    private User labTech;
    private LabTestRequest request;

    private UserPrincipal toPrincipal(User u) {
        return u != null ? new UserPrincipal(u.getId(), u.getEmail(), u.getAuthorities(), u.getBranchId()) : null;
    }

    @BeforeEach
    void setUp() {
        labTech = new User();
        labTech.setEmail("labtech2@test.com");
        labTech.setPasswordHash("pass");
        labTech.setFirstName("Lab");
        labTech.setLastName("Tech");
        userRepository.save(labTech);

        User patientUser = new User();
        patientUser.setEmail("patient2@test.com");
        patientUser.setPasswordHash("pass");
        patientUser.setFirstName("Patient");
        patientUser.setLastName("Two");
        userRepository.save(patientUser);

        Branch branch = new Branch();
        branch.setName("Main Branch");
        branch.setAddress("123 Main St");
        branch.setCity("Test City");
        branch.setState("TS");
        branch.setCountry("USA");
        branch.setPostalCode("12345");
        branch.setPhoneNumber("+11234567890");
        branch.setEmail("branch@test.com");
        branch.setTimezone("UTC");
        branchRepository.save(branch);

        PatientProfile patient = new PatientProfile();
        patient.setUserId(patientUser.getId());
        patient.setBranchId(branch.getId());
        patientProfileRepository.save(patient);

        LabTestCatalog catalog = new LabTestCatalog();
        catalog.setTestCode("GLU");
        catalog.setTestName("Glucose");
        catalog.setReferenceRange("70 - 99");
        catalog.setUnit("mg/dL");
        catalog.setPrice(new java.math.BigDecimal("10.00"));
        catalog.setBranch(branch);
        catalogRepository.save(catalog);

        request = new LabTestRequest();
        request.setPatient(patient);
        request.setTestCatalog(catalog);
        request.setStatus("IN_PROGRESS");
        requestRepository.save(request);
    }

    @Test
    void testNormalResult() {
        LabResult result = new LabResult();
        result.setResultValue("85");
        
        LabResult saved = resultService.addResult(request.getId(), result, toPrincipal(labTech));
        
        assertThat(saved.getIsAbnormal()).isFalse();
        assertThat(saved.getIsCritical()).isFalse();
        
        Optional<LabTestRequest> updatedRequest = requestRepository.findById(request.getId());
        assertThat(updatedRequest).isPresent();
        assertThat(updatedRequest.get().getStatus()).isEqualTo("PENDING_VERIFICATION");
    }

    @Test
    void testAbnormalResult() {
        LabResult result = new LabResult();
        result.setResultValue("102");
        
        LabResult saved = resultService.addResult(request.getId(), result, toPrincipal(labTech));
        
        assertThat(saved.getIsAbnormal()).isTrue();
        assertThat(saved.getIsCritical()).isFalse();
    }

    @Test
    void testCriticalResult() {
        LabResult result = new LabResult();
        result.setResultValue("130");
        
        LabResult saved = resultService.addResult(request.getId(), result, toPrincipal(labTech));
        
        assertThat(saved.getIsAbnormal()).isTrue();
        assertThat(saved.getIsCritical()).isTrue();
    }
}
