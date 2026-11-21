package com.healthcare.clinic.pharmacy.service;

import com.healthcare.clinic.integration.ClinicIntegrationClient;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.pharmacy.dto.DispenseItemRequest;
import com.healthcare.clinic.pharmacy.dto.DispenseRequest;
import com.healthcare.clinic.pharmacy.entity.Medicine;
import com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionRecord;
import com.healthcare.clinic.pharmacy.entity.StockBatch;
import com.healthcare.clinic.pharmacy.repository.MedicineRepository;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class PharmacyDispensingConcurrencyTest {

    @Autowired
    private PharmacyDispensingService dispensingService;

    @Autowired
    private StockBatchRepository stockBatchRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private com.healthcare.clinic.pharmacy.repository.PrescriptionRepository prescriptionRepository;

    @Autowired
    private UserRepository userRepository;

    // Spring Boot 4.x: @MockitoBean replaces @MockBean
    @MockitoBean
    private ClinicIntegrationClient clinicIntegrationClient;

    private User testPharmacist;
    private Medicine testMedicine;
    private PharmacyPrescriptionRecord prescriptionRecord1;
    private PharmacyPrescriptionRecord prescriptionRecord2;

    @BeforeEach
    void setUp() {
        stockBatchRepository.deleteAll();
        prescriptionRepository.deleteAll();
        medicineRepository.deleteAll();
        try { userRepository.deleteAll(); } catch (Exception ignored) {}

        testPharmacist = new User();
        testPharmacist.setEmail("pharmacist_" + System.nanoTime() + "@test.com");
        testPharmacist.setPasswordHash("$2a$10$password");
        testPharmacist.setFirstName("John");
        testPharmacist.setLastName("Doe");
        testPharmacist.setRoles(Collections.emptySet());
        testPharmacist = userRepository.save(testPharmacist);

        testMedicine = new Medicine();
        testMedicine.setName("Paracetamol 500mg");
        testMedicine.setGenericName("Paracetamol");
        testMedicine.setManufacturer("Test Pharma");
        testMedicine.setProductType("MEDICINE");
        testMedicine = medicineRepository.save(testMedicine);

        // One batch with 10 units — two concurrent threads will each try to take 8
        StockBatch batch = new StockBatch();
        batch.setMedicine(testMedicine);
        batch.setMedicineName(testMedicine.getName());
        batch.setBatchNumber("BATCH-001");
        batch.setQuantityReceived(10);
        batch.setQuantityAvailable(10);
        batch.setManufacturingDate(LocalDate.now().minusMonths(1));
        batch.setExpiryDate(LocalDate.now().plusMonths(12));
        batch.setPurchasePrice(new BigDecimal("2.00"));
        batch.setMrp(new BigDecimal("5.00"));
        stockBatchRepository.save(batch);

        prescriptionRecord1 = new PharmacyPrescriptionRecord();
        prescriptionRecord1.setPatientName("Patient One");
        prescriptionRecord1.setDoctorName("Doctor One");
        prescriptionRecord1.setVerificationStatus("VERIFIED");
        prescriptionRecord1.setStatus("PENDING");
        prescriptionRecord1.setClinicalPrescriptionId(101L);
        prescriptionRecord1.setPrescriptionDate(LocalDateTime.now());
        prescriptionRecord1 = prescriptionRepository.save(prescriptionRecord1);

        prescriptionRecord2 = new PharmacyPrescriptionRecord();
        prescriptionRecord2.setPatientName("Patient One");
        prescriptionRecord2.setDoctorName("Doctor One");
        prescriptionRecord2.setVerificationStatus("VERIFIED");
        prescriptionRecord2.setStatus("PENDING");
        prescriptionRecord2.setClinicalPrescriptionId(102L);
        prescriptionRecord2.setPrescriptionDate(LocalDateTime.now());
        prescriptionRecord2 = prescriptionRepository.save(prescriptionRecord2);

        com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem item1 = new com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem();
        item1.setPharmacyPrescription(prescriptionRecord1);
        item1.setMedicationName(testMedicine.getName());
        item1.setMedicineId(testMedicine.getId());
        item1.setPrescribedQuantity(8);
        item1.setDosage("1x1");
        item1.setFrequency("Daily");
        item1.setDuration("8 days");
        prescriptionRecord1.setItems(List.of(item1));
        prescriptionRepository.save(prescriptionRecord1);

        com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem item2 = new com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem();
        item2.setPharmacyPrescription(prescriptionRecord2);
        item2.setMedicationName(testMedicine.getName());
        item2.setMedicineId(testMedicine.getId());
        item2.setPrescribedQuantity(8);
        item2.setDosage("1x1");
        item2.setFrequency("Daily");
        item2.setDuration("8 days");
        prescriptionRecord2.setItems(List.of(item2));
        prescriptionRepository.save(prescriptionRecord2);

        // Stub cross-DB doctor prescription lookup
        com.healthcare.clinic.doctor.entity.Prescription cp1 = new com.healthcare.clinic.doctor.entity.Prescription();
        cp1.setId(101L);
        cp1.setPatientId(1L);
        cp1.setAppointmentId(1L);

        com.healthcare.clinic.doctor.entity.Prescription cp2 = new com.healthcare.clinic.doctor.entity.Prescription();
        cp2.setId(102L);
        // No mock needed for clinic integration since it's fire-and-forget inside the dispensing service
    }

    @AfterEach
    void tearDown() {
        stockBatchRepository.deleteAll();
        prescriptionRepository.deleteAll();
        medicineRepository.deleteAll();
        try { userRepository.deleteAll(); } catch (Exception ignored) {}
    }

    @Test
    void testConcurrentDispense_PreventsNegativeStock() throws InterruptedException {
        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        // Thread 1: dispense 8 units from prescription 1
        executor.submit(() -> {
            try {
                startGate.await();
                DispenseRequest req = DispenseRequest.builder()
                        .prescriptionId(prescriptionRecord1.getId())
                        .items(List.of(DispenseItemRequest.builder()
                                .medicineId(testMedicine.getId())
                                .quantity(8)
                                .build()))
                        .build();
                dispensingService.dispensePrescription(req, testPharmacist);
                successCount.incrementAndGet();
            } catch (Exception e) {
                failCount.incrementAndGet();
                System.err.println("Thread 1 failed: " + e.getMessage());
            } finally {
                doneLatch.countDown();
            }
        });

        // Thread 2: dispense 8 units from prescription 2 (same batch, only 10 total)
        executor.submit(() -> {
            try {
                startGate.await();
                DispenseRequest req = DispenseRequest.builder()
                        .prescriptionId(prescriptionRecord2.getId())
                        .items(List.of(DispenseItemRequest.builder()
                                .medicineId(testMedicine.getId())
                                .quantity(8)
                                .build()))
                        .build();
                dispensingService.dispensePrescription(req, testPharmacist);
                successCount.incrementAndGet();
            } catch (Exception e) {
                failCount.incrementAndGet();
                System.err.println("Thread 2 failed: " + e.getMessage());
            } finally {
                doneLatch.countDown();
            }
        });

        // Release both threads simultaneously
        startGate.countDown();
        doneLatch.await();
        executor.shutdown();

        // With FEFO pessimistic locking: exactly one should succeed (8 dispensed),
        // the other fails because only 2 remain (< 8 requested).
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(failCount.get()).isEqualTo(1);

        // Stock should be 2 remaining (10 - 8)
        List<StockBatch> batches = stockBatchRepository.findAll();
        assertThat(batches).isNotEmpty();
        int totalAvailable = batches.stream().mapToInt(b -> b.getQuantityAvailable()).sum();
        assertThat(totalAvailable).isEqualTo(2);
    }
}
