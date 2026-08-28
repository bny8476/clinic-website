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

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
public class LabBatch3IntegrationTest {

    @Autowired
    private LabResultService resultService;

    @Autowired
    private LabReportVerificationService verificationService;

    @Autowired
    private LabReportPdfGenerator pdfGenerator;

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
    private User pathologist;
    private LabTestRequest pendingRequest;

    private UserPrincipal toPrincipal(User u) {
        return u != null ? new UserPrincipal(u.getId(), u.getEmail(), u.getAuthorities(), u.getBranchId()) : null;
    }

    @BeforeEach
    public void setup() {
        // Branch
        Branch branch = new Branch();
        branch.setName("Test Branch Batch 3");
        branch.setAddress("123 Main St");
        branch.setCity("Test City");
        branch.setState("TS");
        branch.setCountry("USA");
        branch.setPostalCode("12345");
        branch.setPhoneNumber("+11234567890");
        branch.setEmail("branch3@test.com");
        branch.setTimezone("UTC");
        branchRepository.save(branch);

        // Lab Tech
        labTech = new User();
        labTech.setEmail("labtech3@test.com");
        labTech.setPasswordHash("password");
        labTech.setFirstName("Lab");
        labTech.setLastName("Tech");
        userRepository.save(labTech);

        // Pathologist
        pathologist = new User();
        pathologist.setEmail("pathologist3@test.com");
        pathologist.setPasswordHash("password");
        pathologist.setFirstName("Path");
        pathologist.setLastName("Ologist");
        userRepository.save(pathologist);

        // Patient User
        User patientUser = new User();
        patientUser.setEmail("patient3@test.com");
        patientUser.setPasswordHash("password");
        patientUser.setFirstName("Patient");
        patientUser.setLastName("Three");
        userRepository.save(patientUser);

        // Patient Profile
        PatientProfile patient = new PatientProfile();
        patient.setUserId(patientUser.getId());
        patient.setBranchId(branch.getId());
        patientProfileRepository.save(patient);

        // Catalog Item
        LabTestCatalog catalog = new LabTestCatalog();
        catalog.setTestCode("CBC");
        catalog.setTestName("Complete Blood Count");
        catalog.setReferenceRange("12.0 - 16.0");
        catalog.setUnit("g/dL");
        catalog.setPrice(new java.math.BigDecimal("25.00"));
        catalog.setBranch(branch);
        catalogRepository.save(catalog);

        // Request
        pendingRequest = new LabTestRequest();
        pendingRequest.setPatient(patient);
        pendingRequest.setTestCatalog(catalog);
        pendingRequest.setStatus("IN_PROGRESS");
        requestRepository.save(pendingRequest);

        // Add initial result
        LabResult res = new LabResult();
        res.setResultValue("14.2");
        resultService.addResult(pendingRequest.getId(), res, toPrincipal(labTech));
        
        // Refresh request
        pendingRequest = requestRepository.findById(pendingRequest.getId()).get();
    }

    @Test
    public void testVerificationAndDigitalSignature() {
        // Verify result
        String comments = "Looks good. Normal levels.";
        LabResult verifiedResult = verificationService.verifyReport(pendingRequest.getId(), toPrincipal(pathologist), comments);

        // Assertions
        assertThat(verifiedResult.getVerifiedBy().getId()).isEqualTo(pathologist.getId());
        assertThat(verifiedResult.getPathologistComments()).isEqualTo(comments);
        assertNotNull(verifiedResult.getVerifiedAt());

        LabTestRequest updatedRequest = requestRepository.findById(pendingRequest.getId()).get();
        assertThat(updatedRequest.getStatus()).isEqualTo("VERIFIED");
        assertNotNull(updatedRequest.getReleasedAt());
    }

    @Test
    public void testPdfGeneration() {
        verificationService.verifyReport(pendingRequest.getId(), toPrincipal(pathologist), "Approved.");
        
        LabTestRequest updatedRequest = requestRepository.findById(pendingRequest.getId()).get();
        LabResult result = resultRepository.findByRequestId(updatedRequest.getId()).get();

        byte[] pdfBytes = pdfGenerator.generateLabReport(updatedRequest, result);

        assertNotNull(pdfBytes);
        assertThat(pdfBytes.length).isGreaterThan(0);
        
        String pdfHeader = new String(pdfBytes, 0, 4);
        assertThat(pdfHeader).isEqualTo("%PDF");
    }

    @Test
    public void testVerificationFailsIfNotPending() {
        pendingRequest.setStatus("REQUESTED");
        requestRepository.save(pendingRequest);

        assertThrows(IllegalStateException.class, () -> {
            verificationService.verifyReport(pendingRequest.getId(), toPrincipal(pathologist), "Should fail");
        });
    }
}
