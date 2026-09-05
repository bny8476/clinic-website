package com.healthcare.clinic.laboratory.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.laboratory.entity.LabInventoryItem;
import com.healthcare.clinic.laboratory.entity.LabTestCatalog;
import com.healthcare.clinic.laboratory.repository.LabInventoryItemRepository;
import com.healthcare.clinic.laboratory.repository.LabQualityControlRepository;
import com.healthcare.clinic.laboratory.repository.LabTestCatalogRepository;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
public class LabBatch4IntegrationTest {

    @Autowired
    private LabOperationalService operationalService;

    @Autowired
    private LabInventoryItemRepository inventoryRepository;

    @Autowired
    private LabQualityControlRepository qcRepository;

    @Autowired
    private LabTestCatalogRepository catalogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    private User labTech;
    private LabTestCatalog catalog;

    private UserPrincipal toPrincipal(User u) {
        return u != null ? new UserPrincipal(u.getId(), u.getEmail(), u.getAuthorities(), u.getBranchId()) : null;
    }

    @BeforeEach
    public void setup() {
        Branch branch = new Branch();
        branch.setName("Test Branch Batch 4");
        branch.setAddress("123 Main St");
        branch.setCity("Test City");
        branch.setState("TS");
        branch.setCountry("USA");
        branch.setPostalCode("12345");
        branch.setPhoneNumber("+11234567890");
        branch.setEmail("branch4@test.com");
        branch.setTimezone("UTC");
        branchRepository.save(branch);

        labTech = new User();
        labTech.setEmail("labtech4@test.com");
        labTech.setPasswordHash("password");
        labTech.setFirstName("Lab");
        labTech.setLastName("Tech");
        userRepository.save(labTech);

        catalog = new LabTestCatalog();
        catalog.setTestCode("CBC");
        catalog.setTestName("Complete Blood Count");
        catalog.setPrice(java.math.BigDecimal.valueOf(50.00));
        catalog.setBranch(branch);
        catalogRepository.save(catalog);

        LabInventoryItem item = new LabInventoryItem();
        item.setItemName("CBC Reagent");
        item.setSku("REAG-CBC-01");
        item.setQuantity(50);
        item.setMinimumThreshold(10);
        item.setUnit("mL");
        item.setBranch(branch);
        inventoryRepository.save(item);
    }

    @Test
    public void testInventoryDeduction() {
        LabInventoryItem item = operationalService.deductInventory("REAG-CBC-01", 5);
        assertThat(item.getQuantity()).isEqualTo(45);
    }

    @Test
    public void testInventoryDeductionInsufficient() {
        assertThrows(IllegalStateException.class, () -> {
            operationalService.deductInventory("REAG-CBC-01", 60);
        });
    }

    @Test
    public void testQualityControlValidationPass() {
        operationalService.recordQualityControl(catalog.getId(), "PASSED", "All good", toPrincipal(labTech));
        operationalService.validateQcPassed(catalog.getId());
    }

    @Test
    public void testQualityControlValidationFail() {
        operationalService.recordQualityControl(catalog.getId(), "FAILED", "Calibration out of range", toPrincipal(labTech));
        
        Exception ex = assertThrows(IllegalStateException.class, () -> {
            operationalService.validateQcPassed(catalog.getId());
        });
        
        assertThat(ex.getMessage()).contains("Quality Control FAILED");
    }

    @Test
    public void testDashboardStats() {
        Map<String, Object> stats = operationalService.getDashboardStats(1L);
        assertThat(stats).containsKey("pendingRequests");
        assertThat(stats).containsKey("lowStockItems");
    }
}
