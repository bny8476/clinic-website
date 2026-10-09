package com.healthcare.clinic.pharmacy.worker;

import com.healthcare.clinic.doctor.entity.Prescription;
import com.healthcare.clinic.doctor.repository.PrescriptionRepository;
import com.healthcare.clinic.pharmacy.entity.PharmacyOutboxEvent;
import com.healthcare.clinic.pharmacy.repository.PharmacyOutboxEventRepository;
import com.healthcare.clinic.pharmacy.service.PharmacyOutboxSyncWorker;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@org.springframework.transaction.annotation.Transactional
@org.springframework.test.context.ActiveProfiles("test")
public class PharmacyOutboxSyncWorkerTest {

    @Autowired
    private PharmacyOutboxSyncWorker worker;

    @Autowired
    private PharmacyOutboxEventRepository outboxEventRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private com.healthcare.clinic.identity.repository.UserRepository userRepository;

    @Test
    public void testSyncStatusUpdatesClinicPrescription() {
        // Setup
        com.healthcare.clinic.identity.entity.User patientUser = userRepository.findByEmail("syncworker.patient@test.com").orElseGet(() -> {
            com.healthcare.clinic.identity.entity.User u = new com.healthcare.clinic.identity.entity.User();
            u.setEmail("syncworker.patient@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("Pat");
            u.setLastName("Ient");
            return userRepository.save(u);
        });

        Prescription p = new Prescription();
        p.setPharmacyStatus("PENDING");
        p.setDoctorId(patientUser.getId());
        p.setPatientId(patientUser.getId());
        // Other fields might be required depending on constraints
        p = prescriptionRepository.save(p);

        PharmacyOutboxEvent event = new PharmacyOutboxEvent();
        event.setAggregateType("PHARMACY_PRESCRIPTION");
        event.setAggregateId(p.getId().toString());
        event.setEventType("STATUS_UPDATE");
        event.setStatus("PENDING");
        event.setPayload("{\"clinicalPrescriptionId\": " + p.getId() + ", \"status\": \"DISPENSED\", \"pharmacistUsername\": \"ph1\", \"dispensedAt\": \"2026-08-08T10:00:00\", \"items\": []}");
        event = outboxEventRepository.save(event);

        // Act
        worker.processOutbox();

        // Assert
        Optional<PharmacyOutboxEvent> updatedEvent = outboxEventRepository.findById(event.getId());
        assertTrue(updatedEvent.isPresent());
        assertEquals("PROCESSED", updatedEvent.get().getStatus());

        Optional<Prescription> updatedPrescription = prescriptionRepository.findById(p.getId());
        assertTrue(updatedPrescription.isPresent());
        assertEquals("DISPENSED", updatedPrescription.get().getPharmacyStatus());
    }
}
