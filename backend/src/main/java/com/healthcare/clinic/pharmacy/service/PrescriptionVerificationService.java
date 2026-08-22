package com.healthcare.clinic.pharmacy.service;


import com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionRecord;
import com.healthcare.clinic.pharmacy.exception.ResourceNotFoundException;
import com.healthcare.clinic.pharmacy.repository.PrescriptionRepository;

import com.healthcare.clinic.pharmacy.entity.PharmacyOutboxEvent;
import com.healthcare.clinic.pharmacy.repository.PharmacyOutboxEventRepository;
import com.healthcare.clinic.pharmacy.dto.OutboxStatusUpdatePayload;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service("pharmacyPrescriptionVerificationService")
public class PrescriptionVerificationService {

    private final PrescriptionRepository prescriptionRepository;
    private final PharmacyOutboxEventRepository pharmacyOutboxEventRepository;
    private final ObjectMapper objectMapper;

    public PrescriptionVerificationService(
            PrescriptionRepository prescriptionRepository,
            PharmacyOutboxEventRepository pharmacyOutboxEventRepository,
            ObjectMapper objectMapper) {
        this.prescriptionRepository = prescriptionRepository;
        this.pharmacyOutboxEventRepository = pharmacyOutboxEventRepository;
        this.objectMapper = objectMapper;
    }

    private void saveOutboxEvent(Long id, String status, String username, LocalDateTime dispensedAt) {
        try {
            OutboxStatusUpdatePayload payload = OutboxStatusUpdatePayload.builder()
                .clinicalPrescriptionId(id)
                .status(status)
                .pharmacistUsername(username)
                .dispensedAt(dispensedAt)
                .build();
            PharmacyOutboxEvent event = PharmacyOutboxEvent.builder()
                .aggregateType("PHARMACY_PRESCRIPTION")
                .aggregateId(id != null ? id.toString() : "0")
                .eventType("STATUS_UPDATE")
                .payload(objectMapper.writeValueAsString(payload))
                .status("PENDING")
                .build();
            pharmacyOutboxEventRepository.save(event);
        } catch(Exception e) {
            throw new RuntimeException("Failed to serialize outbox event", e);
        }
    }

    public PharmacyPrescriptionRecord verifyPrescription(Long id, String pharmacistUsername) {
        PharmacyPrescriptionRecord saved = updateVerificationStatus(id, "VERIFIED", pharmacistUsername, null);
        // Sync back to clinical record if linked
        saveOutboxEvent(saved.getClinicalPrescriptionId(), "VERIFIED", pharmacistUsername, null);
        return saved;
    }

    public PharmacyPrescriptionRecord rejectPrescription(Long id, String reason, String pharmacistUsername) {
        PharmacyPrescriptionRecord saved = updateVerificationStatus(id, "REJECTED", pharmacistUsername, "CANCELLED");
        saveOutboxEvent(saved.getClinicalPrescriptionId(), "CANCELLED", pharmacistUsername, null);
        return saved;
    }

    public PharmacyPrescriptionRecord dispensePrescription(Long id, String pharmacistUsername) {
        PharmacyPrescriptionRecord saved = updateVerificationStatusForDispense(id, pharmacistUsername);
        // Sync dispensed status back to clinical record
        saveOutboxEvent(saved.getClinicalPrescriptionId(), "DISPENSED", pharmacistUsername, saved.getDispensedAt());
        return saved;
    }

    @Transactional
    public PharmacyPrescriptionRecord updateVerificationStatus(Long id, String verificationStatus, String pharmacistUsername, String status) {
        PharmacyPrescriptionRecord p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));

        p.setVerificationStatus(verificationStatus);
        p.setVerifiedBy(pharmacistUsername);
        p.setVerifiedAt(LocalDateTime.now());
        if (status != null) {
            p.setStatus(status);
        }
        return prescriptionRepository.save(p);
    }

    @Transactional
    public PharmacyPrescriptionRecord updateVerificationStatusForDispense(Long id, String pharmacistUsername) {
        PharmacyPrescriptionRecord p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));

        if (!"VERIFIED".equals(p.getVerificationStatus())) {
            throw new IllegalStateException("Prescription must be verified before dispensing");
        }

        p.setStatus("DISPENSED");
        p.setDispensedAt(LocalDateTime.now());
        p.setDispensedBy(pharmacistUsername);
        return prescriptionRepository.save(p);
    }
}
