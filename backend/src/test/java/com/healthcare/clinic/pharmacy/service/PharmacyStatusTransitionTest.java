package com.healthcare.clinic.pharmacy.service;

import com.healthcare.clinic.integration.ClinicIntegrationClient;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.pharmacy.dto.DispenseItemRequest;
import com.healthcare.clinic.pharmacy.dto.DispenseRequest;
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
 * Tests the prescription status lifecycle:
 *  PENDING -> (verify) -> VERIFIED -> (dispense all) -> DISPENSED
 *  PENDING -> (verify) -> VERIFIED -> (partial dispense) -> PARTIALLY_DISPENSED
 */
@SpringBootTest
@ActiveProfiles("test")
public class PharmacyStatusTransitionTest {

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

    @BeforeEach
    void setUp() {
        movementRepository.deleteAll();
        dispensedRepository.deleteAll();
        stockBatchRepository.deleteAll();
        prescriptionRepository.deleteAll();
        medicineRepository.deleteAll();
        try { userRepository.deleteAll(); } catch (Exception ignored) {}

        testPharmacist = new User();
        testPharmacist.setEmail("pharmacist_" + System.nanoTime() + "@status-test.com");
        testPharmacist.setPasswordHash("$2a$10$password");
        testPharmacist.setFirstName("Status");
        testPharmacist.setLastName("Tester");
        testPharmacist.setRoles(Collections.emptySet());
        testPharmacist = userRepository.save(testPharmacist);

        testMedicine = new Medicine();
        testMedicine.setName("Ibuprofen 400mg");
        testMedicine.setGenericName("Ibuprofen");
        testMedicine.setManufacturer("Test Pharma");
        testMedicine.setProductType("MEDICINE");
        testMedicine = medicineRepository.save(testMedicine);

        StockBatch batch = new StockBatch();
        batch.setMedicine(testMedicine);
        batch.setMedicineName(testMedicine.getName());
        batch.setBatchNumber("STATUS-BATCH-001");
        batch.setQuantityReceived(50);
        batch.setQuantityAvailable(50);
        batch.setManufacturingDate(LocalDate.now().minusMonths(1));
        batch.setExpiryDate(LocalDate.now().plusMonths(10));
        batch.setPurchasePrice(new BigDecimal("2.00"));
        batch.setMrp(new BigDecimal("8.00"));
        stockBatchRepository.save(batch);

        com.healthcare.clinic.doctor.entity.Prescription cp1 = new com.healthcare.clinic.doctor.entity.Prescription();
        cp1.setId(555L); cp1.setPatientId(1L); cp1.setAppointmentId(1L);
        // No mock needed for clinic integration since it's fire-and-forget inside the dispensing service
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

    private PharmacyPrescriptionRecord createVerifiedPrescription() {
        PharmacyPrescriptionRecord rec = new PharmacyPrescriptionRecord();
        rec.setPatientName("Status Patient");
        rec.setDoctorName("Dr. Status");
        rec.setVerificationStatus("VERIFIED");
        rec.setStatus("PENDING");
        rec.setClinicalPrescriptionId(System.nanoTime());
        rec.setPrescriptionDate(LocalDateTime.now());
        
        com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem item = new com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem();
        item.setMedicineId(testMedicine.getId());
        item.setPrescribedQuantity(300);
        item.setMedicationName(testMedicine.getName());
        item.setDosage("1 tablet");
        item.setRemainingQuantity(300);
        item.setPharmacyPrescription(rec);
        rec.getItems().add(item);
        
        return prescriptionRepository.save(rec);
    }

    @Test
    void testFullDispense_setsStatusDISPENSED() {
        PharmacyPrescriptionRecord rec = createVerifiedPrescription();

        DispenseRequest req = DispenseRequest.builder()
                .prescriptionId(rec.getId())
                .partialDispense(false)
                .items(List.of(DispenseItemRequest.builder()
                        .medicineId(testMedicine.getId())
                        .quantity(10)
                        .build()))
                .build();

        dispensingService.dispensePrescription(req, testPharmacist);

        PharmacyPrescriptionRecord updated = prescriptionRepository.findById(rec.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo("DISPENSED");
        assertThat(dispensedRepository.count()).isEqualTo(1L);
    }

    @Test
    void testPartialDispense_setsStatusPARTIALLY_DISPENSED() {
        PharmacyPrescriptionRecord rec = createVerifiedPrescription();

        DispenseRequest req = DispenseRequest.builder()
                .prescriptionId(rec.getId())
                .partialDispense(true)    // enable partial mode
                .items(List.of(DispenseItemRequest.builder()
                        .medicineId(testMedicine.getId())
                        .quantity(200)    // more than available, but partial=true so it should succeed with what's available
                        .build()))
                .build();

        dispensingService.dispensePrescription(req, testPharmacist);

        PharmacyPrescriptionRecord updated = prescriptionRepository.findById(rec.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo("PARTIALLY_DISPENSED");
    }

    @Test
    void testAlreadyDispensed_throwsException() {
        PharmacyPrescriptionRecord rec = createVerifiedPrescription();

        DispenseRequest req = DispenseRequest.builder()
                .prescriptionId(rec.getId())
                .items(List.of(DispenseItemRequest.builder()
                        .medicineId(testMedicine.getId())
                        .quantity(5)
                        .build()))
                .build();

        // First dispense succeeds
        dispensingService.dispensePrescription(req, testPharmacist);

        // Second dispense with no idempotency key must throw
        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class,
                () -> dispensingService.dispensePrescription(
                        DispenseRequest.builder()
                                .prescriptionId(rec.getId())
                                .items(List.of(DispenseItemRequest.builder()
                                        .medicineId(testMedicine.getId())
                                        .quantity(5)
                                        .build()))
                                .build(),
                        testPharmacist));
    }
}
