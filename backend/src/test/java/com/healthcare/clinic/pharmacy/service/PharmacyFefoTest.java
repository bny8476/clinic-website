package com.healthcare.clinic.pharmacy.service;

import com.healthcare.clinic.integration.ClinicIntegrationClient;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.pharmacy.dto.DispenseItemRequest;
import com.healthcare.clinic.pharmacy.dto.DispenseRequest;
import com.healthcare.clinic.pharmacy.entity.InventoryMovement;
import com.healthcare.clinic.pharmacy.entity.Medicine;
import com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionRecord;
import com.healthcare.clinic.pharmacy.entity.StockBatch;
import com.healthcare.clinic.pharmacy.repository.InventoryMovementRepository;
import com.healthcare.clinic.pharmacy.repository.MedicineRepository;
import com.healthcare.clinic.pharmacy.repository.PrescriptionDispensedRepository;
import com.healthcare.clinic.pharmacy.repository.StockBatchRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that FEFO (First-Expired-First-Out) batch selection always deducts
 * stock from the batch with the earliest expiry date first.
 */
@SpringBootTest
@ActiveProfiles("test")
public class PharmacyFefoTest {

    @Autowired private PharmacyDispensingService dispensingService;
    @Autowired private StockBatchRepository stockBatchRepository;
    @Autowired private MedicineRepository medicineRepository;
    @Autowired private com.healthcare.clinic.pharmacy.repository.PrescriptionRepository prescriptionRepository;
    @Autowired private PrescriptionDispensedRepository dispensedRepository;
    @Autowired private InventoryMovementRepository movementRepository;
    @Autowired private UserRepository userRepository;

    @MockitoBean private ClinicIntegrationClient clinicIntegrationClient;

    private User testPharmacist;
    private Medicine testMedicine;
    private StockBatch earlyBatch;  // expires sooner — should be picked first
    private StockBatch lateBatch;   // expires later
    private PharmacyPrescriptionRecord testRecord;

    @BeforeEach
    void setUp() {
        movementRepository.deleteAll();
        dispensedRepository.deleteAll();
        stockBatchRepository.deleteAll();
        prescriptionRepository.deleteAll();
        medicineRepository.deleteAll();
        try { userRepository.deleteAll(); } catch (Exception ignored) {}

        testPharmacist = new User();
        testPharmacist.setEmail("pharmacist_" + System.nanoTime() + "@fefo-test.com");
        testPharmacist.setPasswordHash("$2a$10$password");
        testPharmacist.setFirstName("Fefo");
        testPharmacist.setLastName("Tester");
        testPharmacist.setRoles(Collections.emptySet());
        testPharmacist = userRepository.save(testPharmacist);

        testMedicine = new Medicine();
        testMedicine.setName("Metformin 500mg");
        testMedicine.setGenericName("Metformin");
        testMedicine.setManufacturer("Test Pharma");
        testMedicine.setProductType("MEDICINE");
        testMedicine = medicineRepository.save(testMedicine);

        // Batch that expires SOONER (should be consumed first)
        earlyBatch = new StockBatch();
        earlyBatch.setMedicine(testMedicine);
        earlyBatch.setMedicineName(testMedicine.getName());
        earlyBatch.setBatchNumber("FEFO-EARLY-001");
        earlyBatch.setQuantityReceived(5);
        earlyBatch.setQuantityAvailable(5);
        earlyBatch.setManufacturingDate(LocalDate.now().minusMonths(6));
        earlyBatch.setExpiryDate(LocalDate.now().plusMonths(2));   // expires soon
        earlyBatch.setPurchasePrice(new BigDecimal("2.00"));
        earlyBatch.setMrp(new BigDecimal("5.00"));
        earlyBatch = stockBatchRepository.save(earlyBatch);

        // Batch that expires LATER
        lateBatch = new StockBatch();
        lateBatch.setMedicine(testMedicine);
        lateBatch.setMedicineName(testMedicine.getName());
        lateBatch.setBatchNumber("FEFO-LATE-002");
        lateBatch.setQuantityReceived(20);
        lateBatch.setQuantityAvailable(20);
        lateBatch.setManufacturingDate(LocalDate.now().minusMonths(1));
        lateBatch.setExpiryDate(LocalDate.now().plusMonths(12));   // expires later
        lateBatch.setPurchasePrice(new BigDecimal("2.00"));
        lateBatch.setMrp(new BigDecimal("5.00"));
        lateBatch = stockBatchRepository.save(lateBatch);

        testRecord = new PharmacyPrescriptionRecord();
        testRecord.setPatientName("FEFO Patient");
        testRecord.setDoctorName("Dr. FEFO");
        testRecord.setVerificationStatus("VERIFIED");
        testRecord.setStatus("PENDING");
        testRecord.setClinicalPrescriptionId(System.nanoTime());
        testRecord.setPrescriptionDate(LocalDateTime.now());
        
        com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem item = new com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem();
        item.setMedicineId(testMedicine.getId());
        item.setPrescribedQuantity(30);
        item.setMedicationName(testMedicine.getName());
        item.setDosage("1 tablet");
        item.setRemainingQuantity(30);
        item.setPharmacyPrescription(testRecord);
        testRecord.getItems().add(item);
        
        testRecord = prescriptionRepository.save(testRecord);


    }

    @AfterEach
    void tearDown() {
        movementRepository.deleteAll();
        dispensedRepository.deleteAll();
        stockBatchRepository.deleteAll();
        prescriptionRepository.deleteAll();
        medicineRepository.deleteAll();
        try { userRepository.deleteAll(); } catch (Exception ignored) {}
    }

    @Test
    void testFefoAllocation_earlyExpiryBatchConsumedFirst() {
        // Request 7 units — should take all 5 from the early batch, then 2 from late
        DispenseRequest req = DispenseRequest.builder()
                .prescriptionId(testRecord.getId())
                .items(List.of(DispenseItemRequest.builder()
                        .medicineId(testMedicine.getId())
                        .quantity(7)
                        .build()))
                .build();

        dispensingService.dispensePrescription(req, testPharmacist);

        StockBatch updatedEarly = stockBatchRepository.findById(earlyBatch.getBatchId()).orElseThrow();
        StockBatch updatedLate  = stockBatchRepository.findById(lateBatch.getBatchId()).orElseThrow();

        // Early batch must be fully consumed (5 - 5 = 0)
        assertThat(updatedEarly.getQuantityAvailable()).isEqualTo(0);
        // Late batch must have 2 deducted (20 - 2 = 18)
        assertThat(updatedLate.getQuantityAvailable()).isEqualTo(18);

        // Two inventory movements — one per batch deduction
        List<InventoryMovement> movements = movementRepository.findAll();
        assertThat(movements).hasSize(2);

        // Both movements reference the same prescription dispense
        String firstRef = movements.get(0).getReferenceId();
        assertThat(movements.get(1).getReferenceId()).isEqualTo(firstRef);
    }

    @Test
    void testFefoAllocation_insufficientStock_throwsException() {
        // Request more than total stock (5 + 20 = 25; request 30)
        DispenseRequest req = DispenseRequest.builder()
                .prescriptionId(testRecord.getId())
                .items(List.of(DispenseItemRequest.builder()
                        .medicineId(testMedicine.getId())
                        .quantity(30)
                        .build()))
                .build();

        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class,
                () -> dispensingService.dispensePrescription(req, testPharmacist));

        // Stock must remain unchanged
        assertThat(stockBatchRepository.findById(earlyBatch.getBatchId()).orElseThrow().getQuantityAvailable()).isEqualTo(5);
        assertThat(stockBatchRepository.findById(lateBatch.getBatchId()).orElseThrow().getQuantityAvailable()).isEqualTo(20);
    }
}
