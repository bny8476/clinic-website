package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.doctor.entity.Prescription;
import com.healthcare.clinic.doctor.entity.PrescriptionReconciliationMismatch;
import com.healthcare.clinic.doctor.repository.PrescriptionRepository;
import com.healthcare.clinic.doctor.repository.PrescriptionReconciliationMismatchRepository;
import com.healthcare.clinic.integration.PharmacyIntegrationClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionReconciliationJob {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionReconciliationMismatchRepository mismatchRepository;
    private final PharmacyIntegrationClient pharmacyIntegrationClient;

    @Scheduled(fixedRateString = "PT15M", initialDelayString = "PT3M")
    public void reconcilePrescriptions() {
        log.info("Starting Prescription Reconciliation Job...");
        
        // Find prescriptions signed in the last 7 days that are not DISPENSED
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<Prescription> recentPrescriptions = prescriptionRepository.findBySignedAtAfterAndPharmacyStatusNot(sevenDaysAgo, "DISPENSED");

        for (Prescription prescription : recentPrescriptions) {
            try {
                // Fetch status from Pharmacy module
                Map<String, Object> pharmacyData = pharmacyIntegrationClient.getPharmacyPrescriptionStatus(prescription.getId());
                if (pharmacyData == null || !pharmacyData.containsKey("status")) {
                    log.warn("Pharmacy record not found for prescription: {}", prescription.getId());
                    continue;
                }

                String pharmacyStatus = (String) pharmacyData.get("status");

                if (!prescription.getPharmacyStatus().equals(pharmacyStatus)) {
                    log.error("Mismatch found for Prescription {}: Clinic Status = {}, Pharmacy Status = {}", 
                            prescription.getId(), prescription.getPharmacyStatus(), pharmacyStatus);
                    
                    // Save to mismatch table
                    PrescriptionReconciliationMismatch mismatch = PrescriptionReconciliationMismatch.builder()
                            .clinicalPrescriptionId(prescription.getId())
                            .clinicStatus(prescription.getPharmacyStatus())
                            .pharmacyStatus(pharmacyStatus)
                            .mismatchDetails("Status mismatch detected by reconciliation job.")
                            .build();
                    
                    mismatchRepository.save(mismatch);
                }
            } catch (Exception e) {
                log.error("Error reconciling prescription {}: {}", prescription.getId(), e.getMessage());
            }
        }
        
        log.info("Finished Prescription Reconciliation Job.");
    }
}
