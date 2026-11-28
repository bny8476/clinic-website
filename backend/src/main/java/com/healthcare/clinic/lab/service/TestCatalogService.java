package com.healthcare.clinic.lab.service;

import com.healthcare.clinic.lab.entity.TestCatalog;
import com.healthcare.clinic.lab.repository.TestCatalogRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TestCatalogService {

    private final TestCatalogRepository testCatalogRepository;

    @Transactional(readOnly = true)
    public List<TestCatalog> getActiveCatalog() {
        return testCatalogRepository.findByIsActiveTrueOrderByTestNameAsc();
    }

    @Transactional(readOnly = true)
    public List<TestCatalog> getAllCatalog() {
        return testCatalogRepository.findAllByOrderByTestNameAsc();
    }

    @Transactional(readOnly = true)
    public TestCatalog getTestById(Long id) {
        return testCatalogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Test not found with ID: " + id));
    }

    @Transactional
    public TestCatalog createTest(TestCatalog test) {
        if (test.getTestCode() == null || test.getTestCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Test code is required");
        }
        if (testCatalogRepository.existsByTestCode(test.getTestCode().trim())) {
            throw new IllegalArgumentException("Test code already exists: " + test.getTestCode());
        }
        test.setTestCode(test.getTestCode().trim().toUpperCase());
        return testCatalogRepository.save(test);
    }

    @Transactional
    public TestCatalog updateTest(Long id, TestCatalog updated) {
        TestCatalog existing = getTestById(id);
        if (updated.getTestName() != null) existing.setTestName(updated.getTestName());
        if (updated.getDepartment() != null) existing.setDepartment(updated.getDepartment());
        if (updated.getSpecimenType() != null) existing.setSpecimenType(updated.getSpecimenType());
        if (updated.getContainerType() != null) existing.setContainerType(updated.getContainerType());
        if (updated.getTurnaroundTargetHours() != null) existing.setTurnaroundTargetHours(updated.getTurnaroundTargetHours());
        if (updated.getPrice() != null) existing.setPrice(updated.getPrice());
        if (updated.getReferenceRange() != null) existing.setReferenceRange(updated.getReferenceRange());
        if (updated.getUnit() != null) existing.setUnit(updated.getUnit());
        if (updated.getIsActive() != null) existing.setIsActive(updated.getIsActive());
        return testCatalogRepository.save(existing);
    }

    @Transactional
    public TestCatalog setStatus(Long id, boolean active) {
        TestCatalog existing = getTestById(id);
        existing.setIsActive(active);
        return testCatalogRepository.save(existing);
    }

    @Transactional
    public void deleteTest(Long id) {
        testCatalogRepository.deleteById(id);
    }

    @PostConstruct
    @Transactional
    public void seedStandardCatalogIfEmpty() {
        try {
            if (testCatalogRepository.count() > 0) return;

            log.info("Seeding standard diagnostic test catalog...");
            List<TestCatalog> standardTests = List.of(
                TestCatalog.builder().testCode("HEM-CBC").testName("Complete Blood Count (CBC) with Differential").department("Hematology").specimenType("Whole Blood EDTA").containerType("Lavender Top Tube").turnaroundTargetHours(2).price(new BigDecimal("35.00")).referenceRange("12.0 - 16.0").unit("g/dL").isActive(true).build(),
                TestCatalog.builder().testCode("LIPID-PANEL").testName("Comprehensive Lipid & Cholesterol Profile").department("Biochemistry").specimenType("Serum").containerType("SST Gold Top Tube").turnaroundTargetHours(4).price(new BigDecimal("45.00")).referenceRange("120 - 200").unit("mg/dL").isActive(true).build(),
                TestCatalog.builder().testCode("LFT-COMP").testName("Liver Function Test Comprehensive Panel (LFT)").department("Biochemistry").specimenType("Serum").containerType("SST Gold Top Tube").turnaroundTargetHours(4).price(new BigDecimal("50.00")).referenceRange("7 - 56").unit("U/L").isActive(true).build(),
                TestCatalog.builder().testCode("TSH-ULTRA").testName("Thyroid Stimulating Hormone (TSH) Ultra").department("Endocrinology").specimenType("Serum").containerType("Plain Red Top Tube").turnaroundTargetHours(6).price(new BigDecimal("40.00")).referenceRange("0.4 - 4.0").unit("uIU/mL").isActive(true).build(),
                TestCatalog.builder().testCode("GLU-FAST").testName("Fasting Blood Glucose & Glycated HbA1c").department("Endocrinology").specimenType("Plasma").containerType("Sodium Fluoride Grey").turnaroundTargetHours(3).price(new BigDecimal("30.00")).referenceRange("70 - 99").unit("mg/dL").isActive(true).build(),
                TestCatalog.builder().testCode("TROP-I-HS").testName("High-Sensitivity Cardiac Troponin-I").department("Cardiology").specimenType("Plasma").containerType("Heparin Green Top Tube").turnaroundTargetHours(1).price(new BigDecimal("80.00")).referenceRange("< 0.04").unit("ng/mL").isActive(true).build(),
                TestCatalog.builder().testCode("UA-MIC").testName("Urinalysis Complete with Microscopic Exam").department("Clinical Pathology").specimenType("Clean Catch Urine").containerType("Sterile Urine Container").turnaroundTargetHours(2).price(new BigDecimal("25.00")).referenceRange("Negative / Normal").unit("HPF").isActive(true).build(),
                TestCatalog.builder().testCode("KFT-RENAL").testName("Renal Function & Electrolytes Panel (KFT)").department("Biochemistry").specimenType("Serum").containerType("SST Gold Top Tube").turnaroundTargetHours(4).price(new BigDecimal("42.00")).referenceRange("0.6 - 1.2").unit("mg/dL").isActive(true).build(),
                TestCatalog.builder().testCode("IMM-CRP").testName("C-Reactive Protein (CRP) Quantitative").department("Immunology").specimenType("Serum").containerType("SST Gold Top Tube").turnaroundTargetHours(2).price(new BigDecimal("28.00")).referenceRange("< 5.0").unit("mg/L").isActive(true).build(),
                TestCatalog.builder().testCode("VIT-D-TOTAL").testName("Serum Vitamin D (25-Hydroxy)").department("Biochemistry").specimenType("Serum").containerType("SST Gold Top Tube").turnaroundTargetHours(6).price(new BigDecimal("55.00")).referenceRange("30.0 - 100.0").unit("ng/mL").isActive(true).build()
            );
            testCatalogRepository.saveAll(standardTests);
            log.info("Standard test catalog seeded successfully with {} diagnostic tests.", standardTests.size());
        } catch (Exception e) {
            log.warn("Test catalog initialization note: {}", e.getMessage());
        }
    }
}
