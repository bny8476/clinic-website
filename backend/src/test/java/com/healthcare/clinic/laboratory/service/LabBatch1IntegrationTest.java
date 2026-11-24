package com.healthcare.clinic.laboratory.service;

import com.healthcare.clinic.laboratory.entity.LabBarcode;
import com.healthcare.clinic.laboratory.entity.LabTestCatalog;
import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import com.healthcare.clinic.laboratory.repository.LabBarcodeRepository;
import com.healthcare.clinic.laboratory.repository.LabTestCatalogRepository;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class LabBatch1IntegrationTest {

    @Autowired
    private LabCatalogService catalogService;

    @Autowired
    private LabBarcodeService barcodeService;

    @Autowired
    private LabWorklistService worklistService;

    @Autowired
    private LabTestCatalogRepository catalogRepository;

    @Autowired
    private LabTestRequestRepository requestRepository;

    @Autowired
    private LabBarcodeRepository barcodeRepository;

    @Autowired
    private PatientProfileRepository patientRepository;

    private LabTestCatalog test1;
    private LabTestCatalog test2;
    private PatientProfile patient;
    private LabTestRequest req1;
    private LabTestRequest req2;

    @BeforeEach
    void setUp() {
        patient = PatientProfile.builder()
                .userId(999L)
                .branchId(1L)
                .dateOfBirth(java.time.LocalDate.of(1990, 1, 1))
                .gender("MALE")
                .bloodGroup("O+")
                .build();
        patient = patientRepository.save(patient);

        test1 = catalogRepository.findByTestCode("CBC").orElseGet(() -> {
            LabTestCatalog c = LabTestCatalog.builder()
                .testName("Complete Blood Count")
                .testCode("CBC")
                .price(new BigDecimal("25.00"))
                .specimenType("Blood")
                .department("Hematology")
                .containerType("EDTA Tube")
                .isActive(true)
                .build();
            return catalogRepository.save(c);
        });

        test2 = catalogRepository.findByTestCode("FBS").orElseGet(() -> {
            LabTestCatalog c = LabTestCatalog.builder()
                .testName("Fasting Blood Sugar")
                .testCode("FBS")
                .price(new BigDecimal("15.00"))
                .specimenType("Blood")
                .department("Biochemistry")
                .containerType("Fluoride Tube")
                .isActive(true)
                .build();
            return catalogRepository.save(c);
        });

        req1 = LabTestRequest.builder()
                .patient(patient)
                .testCatalog(test1)
                .status("ORDERED")
                .build();
        requestRepository.save(req1);

        req2 = LabTestRequest.builder()
                .patient(patient)
                .testCatalog(test2)
                .status("ORDERED")
                .build();
        requestRepository.save(req2);
    }

    @Test
    void testCatalogManagement() {
        LabTestCatalog newTest = LabTestCatalog.builder()
                .testName("Lipid Panel")
                .testCode("LIPID")
                .price(new BigDecimal("45.00"))
                .specimenType("Serum")
                .build();

        LabTestCatalog saved = catalogService.createTest(newTest);
        assertThat(saved.getId()).isNotNull();

        List<LabTestCatalog> active = catalogService.getAllActiveTests();
        assertThat(active).extracting("testCode").contains("LIPID");

        catalogService.deactivateTest(saved.getId());
        List<LabTestCatalog> activeAfter = catalogService.getAllActiveTests();
        assertThat(activeAfter).extracting("testCode").doesNotContain("LIPID");
    }

    @Test
    void testBarcodeGenerationAndSpecimenGrouping() {
        List<LabBarcode> barcodes = barcodeService.generateBarcodesForRequests(List.of(req1.getId(), req2.getId()));

        assertThat(barcodes).hasSize(1);
        LabBarcode barcode = barcodes.get(0);
        assertThat(barcode.getSpecimenType()).isEqualTo("Blood");
        assertThat(barcode.getBarcodeValue()).contains("BLO");

        LabTestRequest updatedReq1 = requestRepository.findById(req1.getId()).orElseThrow();
        LabTestRequest updatedReq2 = requestRepository.findById(req2.getId()).orElseThrow();

        assertThat(updatedReq1.getLabRequestNumber()).isNotNull();
        assertThat(updatedReq2.getLabRequestNumber()).isEqualTo(updatedReq1.getLabRequestNumber());
        
        assertThat(updatedReq1.getSampleBarcodeId()).isEqualTo(barcode.getBarcodeValue());
        assertThat(updatedReq2.getSampleBarcodeId()).isEqualTo(barcode.getBarcodeValue());
    }

    @Test
    void testWorklistFiltering() {
        Page<LabTestRequest> worklist = worklistService.getWorklist(
                "ORDERED", null, null, patient.getId(), null, "Blood", null, null, null, null, PageRequest.of(0, 10));

        assertThat(worklist.getTotalElements()).isGreaterThanOrEqualTo(2);
        
        Page<LabTestRequest> hematologyWorklist = worklistService.getWorklist(
                "ORDERED", null, null, patient.getId(), null, null, "Hematology", null, null, null, PageRequest.of(0, 10));
                
        assertThat(hematologyWorklist.getTotalElements()).isEqualTo(1);
        assertThat(hematologyWorklist.getContent().get(0).getTestCatalog().getTestCode()).isEqualTo("CBC");
    }
}
