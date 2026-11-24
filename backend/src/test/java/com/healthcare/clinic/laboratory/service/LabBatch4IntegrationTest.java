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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
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
        String suffix = "_" + System.nanoTime();

        Branch branch = branchRepository.findAll().stream().findFirst().orElseGet(() -> {
            Branch b = new Branch();
            b.setName("Test Branch Batch 4");
            b.setAddress("123 Main St");
            b.setCity("Test City");
            b.setState("TS");
            b.setCountry("USA");
            b.setPostalCode("12345");
            b.setPhoneNumber("+11234567890");
            b.setEmail("branch4_" + suffix + "@test.com");
            b.setTimezone("UTC");
            return branchRepository.save(b);
        });

        labTech = new User();
        labTech.setEmail("labtech4" + suffix + "@test.com");
        labTech.setPasswordHash("password");
        labTech.setFirstName("Lab");
        labTech.setLastName("Tech");
        labTech.setBranchId(branch.getId());
        userRepository.save(labTech);

        catalog = new LabTestCatalog();
        catalog.setTestCode("CBC4" + suffix);
        catalog.setTestName("Complete Blood Count");
        catalog.setPrice(java.math.BigDecimal.valueOf(50.00));
        catalog.setBranch(branch);
        catalogRepository.save(catalog);

        LabInventoryItem item = inventoryRepository.findBySku("REAG-CBC-01").orElseGet(() -> {
            LabInventoryItem i = new LabInventoryItem();
            i.setItemName("CBC Reagent");
            i.setSku("REAG-CBC-01");
            i.setMinimumThreshold(10);
            i.setUnit("mL");
            i.setBranch(branch);
            return i;
        });
        item.setQuantity(50);
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
