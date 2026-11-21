package com.healthcare.clinic.pharmacy.service;

import com.healthcare.clinic.integration.ClinicIntegrationClient;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.pharmacy.dto.DispenseItemRequest;
import com.healthcare.clinic.pharmacy.dto.DispenseRequest;
import com.healthcare.clinic.pharmacy.entity.Medicine;
import com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionRecord;
import com.healthcare.clinic.pharmacy.entity.PrescriptionDispensed;
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
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class PharmacyIdempotencyTest {

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
        testPharmacist.setEmail("pharmacist_" + System.nanoTime() + "@idempotency-test.com");
        testPharmacist.setPasswordHash("$2a$10$password");
        testPharmacist.setFirstName("Jane");
        testPharmacist.setLastName("Chem");
        testPharmacist.setRoles(Collections.emptySet());
        testPharmacist = userRepository.save(testPharmacist);

        testMedicine = new Medicine();
        testMedicine.setName("Amoxicillin 500mg");
        testMedicine.setGenericName("Amoxicillin");
        testMedicine.setManufacturer("Test Pharma");
        testMedicine.setProductType("MEDICINE");
        testMedicine = medicineRepository.save(testMedicine);

        StockBatch batch = new StockBatch();
        batch.setMedicine(testMedicine);
        batch.setMedicineName(testMedicine.getName());
        batch.setBatchNumber("IDEM-BATCH-001");
        batch.setQuantityReceived(100);
        batch.setQuantityAvailable(100);
        batch.setManufacturingDate(LocalDate.now().minusMonths(1));
        batch.setExpiryDate(LocalDate.now().plusMonths(12));
        batch.setPurchasePrice(new BigDecimal("3.00"));
        batch.setMrp(new BigDecimal("10.00"));
        stockBatchRepository.save(batch);

        testRecord = new PharmacyPrescriptionRecord();
        testRecord.setPatientName("Idempotency Patient");
        testRecord.setDoctorName("Dr. Idem");
        testRecord.setVerificationStatus("VERIFIED");
        testRecord.setStatus("PENDING");
        testRecord.setClinicalPrescriptionId(999L);
        testRecord.setPrescriptionDate(LocalDateTime.now());
        testRecord = prescriptionRepository.save(testRecord);

        com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem item1 = new com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem();
        item1.setPharmacyPrescription(testRecord);
        item1.setMedicationName(testMedicine.getName());
        item1.setMedicineId(testMedicine.getId());
        item1.setPrescribedQuantity(10);
        item1.setDosage("1x1");
        item1.setFrequency("Daily");
        item1.setDuration("10 days");
        testRecord.setItems(List.of(item1));
        prescriptionRepository.save(testRecord);
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
    void testIdempotentRetry_oneSucess_oneStockDeduction() throws InterruptedException {
        String idempotencyKey = UUID.randomUUID().toString();

        // Build the same request 3 times (identical idempotency key)
        int threadCount = 3;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startGate.await();
                    DispenseRequest req = DispenseRequest.builder()
                            .prescriptionId(testRecord.getId())
                            .idempotencyKey(idempotencyKey)
                            .items(List.of(DispenseItemRequest.builder()
                                    .medicineId(testMedicine.getId())
                                    .quantity(10)
                                    .build()))
                            .build();
                    PrescriptionDispensed result = dispensingService.dispensePrescription(req, testPharmacist);
                    if (result != null) successCount.incrementAndGet();
                } catch (Exception e) {
                    System.err.println("Idempotency test thread failed: " + e.getMessage());
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startGate.countDown();
        doneLatch.await();
        executor.shutdown();

        // All 3 calls must succeed (idempotency returns the cached record)
        assertThat(successCount.get()).isEqualTo(3);

        // Exactly ONE dispense record must exist in the DB
        assertThat(dispensedRepository.count()).isEqualTo(1L);

        // Exactly ONE inventory movement (one actual dispense happened)
        assertThat(movementRepository.count()).isEqualTo(1L);

        // Stock deducted exactly once: 100 - 10 = 90
        int totalAvailable = stockBatchRepository.findAll()
                .stream().mapToInt(StockBatch::getQuantityAvailable).sum();
        assertThat(totalAvailable).isEqualTo(90);
    }
}
