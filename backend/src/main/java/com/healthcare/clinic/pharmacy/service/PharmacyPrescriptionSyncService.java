package com.healthcare.clinic.pharmacy.service;


import com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem;
import com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionRecord;
import com.healthcare.clinic.pharmacy.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PharmacyPrescriptionSyncService {

    private final PrescriptionRepository pharmacyPrescriptionRepository;

    @Transactional
    public void syncNewPrescription(String patientName, String doctorName, Long clinicalPrescriptionId, 
                                    List<PharmacyPrescriptionItem> items) {
        PharmacyPrescriptionRecord pharmRx = pharmacyPrescriptionRepository.findByClinicalPrescriptionId(clinicalPrescriptionId)
                .orElseGet(PharmacyPrescriptionRecord::new);

        pharmRx.setPatientName(patientName);
        pharmRx.setDoctorName(doctorName);
        if (pharmRx.getId() == null) {
            pharmRx.setPrescriptionDate(LocalDateTime.now());
            pharmRx.setStatus("PENDING");
            pharmRx.setVerificationStatus("UNVERIFIED");
            pharmRx.setClinicalPrescriptionId(clinicalPrescriptionId);
            items.forEach(pharmRx::addItem);
        } else {
            // Update items if needed? For idempotency we assume existing items are already there.
            // A more complex sync might update items, but for now we just skip if it exists.
        }
        pharmacyPrescriptionRepository.save(pharmRx);
    }

    @Transactional
    public void syncSendPrescription(String patientName, String doctorName, Long clinicalPrescriptionId, 
                                     Long pharmacyUserId, List<PharmacyPrescriptionItem> items) {
        PharmacyPrescriptionRecord pharmRx = pharmacyPrescriptionRepository.findByClinicalPrescriptionId(clinicalPrescriptionId)
                .orElseGet(PharmacyPrescriptionRecord::new);

        pharmRx.setPatientName(patientName);
        pharmRx.setDoctorName(doctorName);
        if (pharmRx.getId() == null) {
            pharmRx.setPrescriptionDate(LocalDateTime.now());
            pharmRx.setStatus("PENDING");
            pharmRx.setVerificationStatus("UNVERIFIED");
            pharmRx.setClinicalPrescriptionId(clinicalPrescriptionId);
            items.forEach(pharmRx::addItem);
        }
        if (pharmacyUserId != null) {
            pharmRx.setAssignedPharmacyUserId(pharmacyUserId);
        }
        pharmacyPrescriptionRepository.save(pharmRx);
    }

    @Transactional
    public void syncVoidPrescription(Long clinicalPrescriptionId) {
        pharmacyPrescriptionRepository.findByClinicalPrescriptionId(clinicalPrescriptionId)
                .ifPresent(p -> {
                    p.setStatus("CANCELLED");
                    pharmacyPrescriptionRepository.save(p);
                });
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getPharmacyPrescriptionStatus(Long clinicalPrescriptionId) {
        return pharmacyPrescriptionRepository.findByClinicalPrescriptionId(clinicalPrescriptionId)
                .map(p -> java.util.Map.<String, Object>of("status", p.getStatus()))
                .orElse(null);
    }
}
