package com.healthcare.clinic.radiology.service;

import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.radiology.entity.ImagingProcedure;
import com.healthcare.clinic.radiology.entity.ImagingRequest;
import com.healthcare.clinic.radiology.repository.ImagingProcedureRepository;
import com.healthcare.clinic.radiology.repository.ImagingRequestRepository;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
@org.springframework.test.context.ActiveProfiles("test")
public class RadiologyWorkflowIntegrationTest {

    @Autowired
    private RadiologyService radiologyService;

    @Autowired
    private ImagingRequestRepository requestRepository;

    @Autowired
    private ImagingProcedureRepository procedureRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private BranchRepository branchRepository;

    private PatientProfile testPatient;
    private DoctorProfile testDoctor;
    private ImagingProcedure testProcedure;
    private Branch testBranch;

    private UserPrincipal toPrincipal(User u) {
        return u != null ? new UserPrincipal(u.getId(), u.getEmail(), u.getAuthorities(), u.getBranchId()) : null;
    }

    @BeforeEach
    public void setup() {
        testBranch = branchRepository.findAll().stream().findFirst().orElseGet(() -> {
            Branch b = new Branch();
            b.setName("Workflow Branch");
            b.setAddress("123 Main St");
            b.setCity("Test City");
            b.setState("TS");
            b.setCountry("USA");
            b.setPostalCode("12345");
            b.setPhoneNumber("+11234567890");
            b.setEmail("workflow@test.com");
            b.setTimezone("UTC");
            return branchRepository.save(b);
        });

        User patientUser = userRepository.findByEmail("wfpatient@test.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("wfpatient@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("Work");
            u.setLastName("Flow");
            return userRepository.save(u);
        });

        testPatient = patientProfileRepository.findByUserId(patientUser.getId()).orElseGet(() -> {
            PatientProfile p = new PatientProfile();
            p.setUserId(patientUser.getId());
            p.setBranchId(testBranch.getId());
            return patientProfileRepository.save(p);
        });

        User docUser = userRepository.findByEmail("wfdoc@test.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("wfdoc@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("Dr");
            u.setLastName("WF");
            return userRepository.save(u);
        });

        testDoctor = doctorProfileRepository.findByUserId(docUser.getId()).orElseGet(() -> {
            DoctorProfile d = new DoctorProfile();
            d.setUserId(docUser.getId());
            d.setSpecialty("General");
            d.setConsultationFee(java.math.BigDecimal.valueOf(100.00));
            d.setQualifications("MD General");
            d.setBranchId(testBranch.getId());
            return doctorProfileRepository.save(d);
        });

        testProcedure = procedureRepository.findByCode("XR-CHEST").orElseGet(() -> {
            ImagingProcedure proc = new ImagingProcedure();
            proc.setCode("XR-CHEST");
            proc.setName("Chest X-Ray PA View");
            proc.setModality("XRAY");
            proc.setBodyPart("Chest");
            proc.setPrice(new BigDecimal("50.00"));
            return procedureRepository.save(proc);
        });
    }

    @Test
    public void testStatusTransitions() {
        // 1. Order phase
        ImagingRequest newRequest = new ImagingRequest();
        newRequest.setPatient(testPatient);
        newRequest.setDoctor(testDoctor);
        newRequest.setProcedure(testProcedure);
        newRequest.setBranch(testBranch);
        newRequest.setPriority("ROUTINE");
        newRequest.setClinicalNotes("Cough for 3 weeks");

        ImagingRequest created = radiologyService.createRequest(newRequest);
        assertThat(created.getId()).isNotNull();
        assertThat(created.getStatus()).isEqualTo("ORDERED");
        assertThat(created.getInvoice()).isNotNull();

        // 2. Schedule phase
        User patientUser = userRepository.findById(testPatient.getUserId()).orElseThrow();
        ImagingRequest scheduled = radiologyService.bookPatientRequest(created.getId(), ZonedDateTime.now().plusDays(1), toPrincipal(patientUser));
        assertThat(scheduled.getStatus()).isEqualTo("SCHEDULED");
        
        // 3. Acquire Image phase
        ImagingRequest acquired = radiologyService.updateRequestStatus(scheduled.getId(), "IMAGE_ACQUIRED");
        assertThat(acquired.getStatus()).isEqualTo("IMAGE_ACQUIRED");
        
        // 4. Reporting phase
        ImagingRequest reporting = radiologyService.updateRequestStatus(acquired.getId(), "REPORTING");
        assertThat(reporting.getStatus()).isEqualTo("REPORTING");
        
        // 5. Verification phase
        ImagingRequest verified = radiologyService.updateRequestStatus(reporting.getId(), "VERIFIED");
        assertThat(verified.getStatus()).isEqualTo("VERIFIED");
        
        // 6. Release phase
        ImagingRequest released = radiologyService.updateRequestStatus(verified.getId(), "RELEASED");
        assertThat(released.getStatus()).isEqualTo("RELEASED");
    }

    @Test
    public void testInvalidStatusTransition() {
        ImagingRequest newRequest = new ImagingRequest();
        newRequest.setPatient(testPatient);
        newRequest.setDoctor(testDoctor);
        newRequest.setProcedure(testProcedure);
        newRequest.setPriority("STAT");
        
        ImagingRequest created = radiologyService.createRequest(newRequest);

        // Try jumping straight from ORDERED to RELEASED (Invalid)
        assertThrows(IllegalStateException.class, () -> {
            radiologyService.updateRequestStatus(created.getId(), "RELEASED");
        });
    }

    @Test
    public void testDuplicateRequestOnSameDay() {
        ImagingRequest req1 = new ImagingRequest();
        req1.setPatient(testPatient);
        req1.setDoctor(testDoctor);
        req1.setProcedure(testProcedure);
        radiologyService.createRequest(req1);

        // Second request on same day for same patient & procedure should fail
        ImagingRequest req2 = new ImagingRequest();
        req2.setPatient(testPatient);
        req2.setDoctor(testDoctor);
        req2.setProcedure(testProcedure);

        assertThrows(IllegalArgumentException.class, () -> {
            radiologyService.createRequest(req2);
        });
    }
}
