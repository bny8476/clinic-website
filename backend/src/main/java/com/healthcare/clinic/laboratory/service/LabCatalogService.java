package com.healthcare.clinic.laboratory.service;

import com.healthcare.clinic.laboratory.entity.LabTestCatalog;
import com.healthcare.clinic.laboratory.repository.LabTestCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LabCatalogService {

    private final LabTestCatalogRepository catalogRepository;

    @Transactional(readOnly = true)
    public List<LabTestCatalog> getAllActiveTests() {
        return catalogRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public List<LabTestCatalog> getAllTests() {
        return catalogRepository.findAll();
    }

    @Transactional
    public LabTestCatalog createTest(LabTestCatalog test) {
        if (catalogRepository.findByTestCode(test.getTestCode()).isPresent()) {
            throw new IllegalArgumentException("Test code already exists: " + test.getTestCode());
        }
        test.setIsActive(true);
        return catalogRepository.save(test);
    }

    @Transactional
    public LabTestCatalog updateTest(Long id, LabTestCatalog updated) {
        LabTestCatalog existing = catalogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Catalog entry not found"));
        
        existing.setTestName(updated.getTestName());
        existing.setDescription(updated.getDescription());
        existing.setPrice(updated.getPrice());
        existing.setReferenceRange(updated.getReferenceRange());
        existing.setUnit(updated.getUnit());
        existing.setCategory(updated.getCategory());
        existing.setSpecimenType(updated.getSpecimenType());
        existing.setTurnaroundTargetHours(updated.getTurnaroundTargetHours());
        existing.setIsActive(updated.getIsActive());
        existing.setDepartment(updated.getDepartment());
        existing.setContainerType(updated.getContainerType());
        existing.setCollectionInstructions(updated.getCollectionInstructions());
        existing.setMethod(updated.getMethod());
        existing.setInsuranceEligible(updated.getInsuranceEligible());
        existing.setPreparationInstructions(updated.getPreparationInstructions());
        
        return catalogRepository.save(existing);
    }

    @Transactional
    public void deactivateTest(Long id) {
        LabTestCatalog existing = catalogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Catalog entry not found"));
        existing.setIsActive(false);
        catalogRepository.save(existing);
    }

    @Transactional
    public void activateTest(Long id) {
        LabTestCatalog existing = catalogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Catalog entry not found"));
        existing.setIsActive(true);
        catalogRepository.save(existing);
    }
}
