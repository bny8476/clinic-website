package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.doctor.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ClinicPrescriptionSyncService {

    private final PrescriptionRepository clinicalPrescriptionRepository;

    @Transactional
    public void syncClinicalStatus(Long clinicalPrescriptionId, String newStatus, String performedBy, LocalDateTime dispensedAt, java.util.List<java.util.Map<String, Object>> dispensedItems) {
        if (clinicalPrescriptionId == null) return;
        clinicalPrescriptionRepository.findById(clinicalPrescriptionId).ifPresent(clinical -> {
            clinical.setPharmacyStatus(newStatus);
            if ("DISPENSED".equals(newStatus) || "PARTIALLY_DISPENSED".equals(newStatus)) {
                clinical.setDispensedAt(dispensedAt);
                clinical.setDispensedBy(performedBy);
            }
            if (dispensedItems != null) {
                for (java.util.Map<String, Object> dispensedItem : dispensedItems) {
                    if (dispensedItem.get("medicineId") == null) continue;
                    Long medId = Long.valueOf(dispensedItem.get("medicineId").toString());
                    Integer qty = Integer.valueOf(dispensedItem.get("quantityDispensed").toString());
                    clinical.getItems().stream()
                        .filter(i -> medId.equals(i.getMedicineId()))
                        .findFirst()
                        .ifPresent(item -> {
                            item.setDispensedQuantity(item.getDispensedQuantity() + qty);
                            item.setRemainingQuantity(Math.max(0, item.getRemainingQuantity() - qty));
                        });
                }
            }
            clinicalPrescriptionRepository.save(clinical);
        });
    }
}
