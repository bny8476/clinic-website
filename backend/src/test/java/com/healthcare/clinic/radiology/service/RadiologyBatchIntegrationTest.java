package com.healthcare.clinic.radiology.service;

import com.healthcare.clinic.billing.repository.InvoiceRepository;

import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.radiology.entity.DicomStudy;
import com.healthcare.clinic.radiology.entity.ImagingProcedure;
import com.healthcare.clinic.radiology.entity.ImagingRequest;
import com.healthcare.clinic.radiology.entity.RadiologyReport;
import com.healthcare.clinic.radiology.repository.DicomStudyRepository;
import com.healthcare.clinic.radiology.repository.ImagingProcedureRepository;
import com.healthcare.clinic.radiology.repository.ImagingRequestRepository;
import com.healthcare.clinic.radiology.repository.RadiologyReportRepository;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
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
@org.springframework.test.context.ActiveProfiles("test")
public class RadiologyBatchIntegrationTest {

    @Autowired
    private RadiologyService radiologyService;

    @Autowired
    private DicomService dicomService;

    @Autowired
    private RadiologyReportingService reportingService;

    @Autowired
    private ImagingProcedureRepository procedureRepository;

    @Autowired
    private ImagingRequestRepository requestRepository;

    @Autowired
    private DicomStudyRepository dicomStudyRepository;

    @Autowired
    private RadiologyReportRepository reportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientRepository;

    @Autowired
    private DoctorProfileRepository doctorRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    private User doctor;
    private User radiologist;
    private PatientProfile patient;
    private ImagingProcedure procedure;
    private Branch branch;

    private UserPrincipal toPrincipal(User u) {
        return u != null ? new UserPrincipal(u.getId(), u.getEmail(), u.getAuthorities(), u.getBranchId()) : null;
    }

    @BeforeEach
    public void setup() {
        branch = branchRepository.findAll().stream().findFirst().orElseGet(() -> {
            Branch b = new Branch();
            b.setName("Radiology Test Branch");
            b.setAddress("123 Main St");
            b.setCity("Test City");
            b.setState("TS");
            b.setCountry("USA");
            b.setPostalCode("12345");
            b.setPhoneNumber("+11234567890");
            b.setEmail("radbranch@test.com");
            b.setTimezone("UTC");
            return branchRepository.save(b);
        });

        doctor = userRepository.findByEmail("doc.rad@test.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("doc.rad@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("Dr");
            u.setLastName("XRay");
            return userRepository.save(u);
        });

        DoctorProfile docProfile = doctorRepository.findByUserId(doctor.getId()).orElseGet(() -> {
            DoctorProfile dp = new DoctorProfile();
            dp.setUserId(doctor.getId());
            dp.setSpecialty("Radiology");
            dp.setConsultationFee(java.math.BigDecimal.valueOf(100.00));
            dp.setQualifications("MD Radiology");
            dp.setBranchId(branch.getId());
            return doctorRepository.save(dp);
        });

        radiologist = userRepository.findByEmail("radiologist@test.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("radiologist@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("Rad");
            u.setLastName("Tech");
            return userRepository.save(u);
        });

        User patientUser = userRepository.findByEmail("patient.rad@test.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("patient.rad@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("John");
            u.setLastName("Doe");
            return userRepository.save(u);
        });

        patient = patientRepository.findByUserId(patientUser.getId()).orElseGet(() -> {
            PatientProfile p = new PatientProfile();
            p.setUserId(patientUser.getId());
            p.setBranchId(branch.getId());
            return patientRepository.save(p);
        });

        procedure = new ImagingProcedure();
        procedure.setCode("CT-HEAD");
        procedure.setName("CT Head without Contrast");
        procedure.setModality("CT");
        procedure.setBodyPart("Head");
        procedure.setPrice(new BigDecimal("150.00"));
        procedureRepository.save(procedure);
    }

    @Test
    public void testProcedureCatalog() {
        List<ImagingProcedure> procedures = radiologyService.getProcedures();
        assertThat(procedures).isNotEmpty();
    }

    @Test
    public void testRadiologyFullWorkflow() {
        // 1. Create Request
        ImagingRequest request = new ImagingRequest();
        request.setPatient(patient);
        request.setDoctor(doctorRepository.findByUserId(doctor.getId()).get());
        request.setProcedure(procedure);
        request.setBranch(branch);
        request.setClinicalNotes("Headache after trauma");

        ImagingRequest created = radiologyService.createRequest(request);
        assertThat(created.getId()).isNotNull();
        assertThat(created.getStatus()).isEqualTo("ORDERED");

        // 2. Update Status to IMAGE_ACQUIRED
        ImagingRequest updatedRequest = radiologyService.updateRequestStatus(created.getId(), "IMAGE_ACQUIRED");
        assertThat(updatedRequest.getStatus()).isEqualTo("IMAGE_ACQUIRED");

        // 3. Mock DICOM Ingestion
        DicomStudy study = dicomService.saveStudyMock(request.getId(), "CT", toPrincipal(radiologist));
        assertThat(study).isNotNull();
        assertThat(study.getStudyInstanceUid()).isNotNull();

        updatedRequest = requestRepository.findById(request.getId()).orElseThrow();
        assertThat(updatedRequest.getStatus()).isEqualTo("REPORTING");

        // 4. Report Draft and Finalize
        RadiologyReport draft = reportingService.draftReport(request.getId(), "Normal scan.", "No acute intracranial abnormality.", toPrincipal(radiologist));
        assertThat(draft.getStatus()).isEqualTo("DRAFT");
        
        RadiologyReport finalized = reportingService.finalizeReport(draft.getId(), toPrincipal(radiologist));
        assertThat(finalized.getStatus()).isEqualTo("FINALIZED");
        
        // 5. Verify and Release
        RadiologyReport verified = reportingService.verifyReport(finalized.getId(), toPrincipal(radiologist));
        assertThat(verified.getStatus()).isEqualTo("VERIFIED");
        
        RadiologyReport released = reportingService.releaseReport(verified.getId());
        assertThat(released.getStatus()).isEqualTo("VERIFIED");
        
        updatedRequest = requestRepository.findById(request.getId()).orElseThrow();
        assertThat(updatedRequest.getStatus()).isEqualTo("RELEASED");
    }
}
