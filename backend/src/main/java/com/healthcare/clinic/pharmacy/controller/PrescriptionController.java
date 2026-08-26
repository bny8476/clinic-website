package com.healthcare.clinic.pharmacy.controller;


import com.healthcare.clinic.common.dto.ApiResponse;
import com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionRecord;
import com.healthcare.clinic.pharmacy.repository.PrescriptionRepository;
import com.healthcare.clinic.pharmacy.service.PrescriptionVerificationService;
import com.healthcare.clinic.security.SecurityUtils;
import com.healthcare.clinic.identity.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionRecord;
import com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionItem;
import com.healthcare.clinic.pharmacy.entity.Medicine;
import com.healthcare.clinic.pharmacy.repository.MedicineRepository;
import com.healthcare.clinic.pharmacy.dto.DispenseItemRequest;
import java.util.ArrayList;
import java.util.List;
import com.healthcare.clinic.pharmacy.service.PharmacyDispensingService;
import com.healthcare.clinic.pharmacy.dto.DispenseRequest;
import com.healthcare.clinic.pharmacy.entity.PrescriptionDispensed;
import com.healthcare.clinic.identity.entity.User;

@RestController("pharmacyPrescriptionController")
@RequestMapping("/api/pharmacy/prescriptions")
public class PrescriptionController {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionVerificationService verificationService;
    private final UserRepository userRepository;
    private final PharmacyDispensingService pharmacyDispensingService;
    private final MedicineRepository medicineRepository;

    public PrescriptionController(
            PrescriptionRepository prescriptionRepository,
            PrescriptionVerificationService verificationService,
            UserRepository userRepository,
            PharmacyDispensingService pharmacyDispensingService,
            MedicineRepository medicineRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.verificationService = verificationService;
        this.userRepository = userRepository;
        this.pharmacyDispensingService = pharmacyDispensingService;
        this.medicineRepository = medicineRepository;
    }

    /** Returns all PENDING prescriptions with medication items */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','ROLE_DOCTOR','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<PharmacyPrescriptionRecord>>> getPendingPrescriptions() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        List<PharmacyPrescriptionRecord> pending = prescriptionRepository.findByStatusAndAssignedUserId("PENDING", currentUserId);
        return ResponseEntity.ok(ApiResponse.success(pending, "Pending prescriptions fetched"));
    }

    /** Returns all prescriptions (for pharmacy dashboard) */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<PharmacyPrescriptionRecord>>> getAllPrescriptions() {
        return ResponseEntity.ok(ApiResponse.success(prescriptionRepository.findAll(), "All prescriptions fetched"));
    }

    /** Verify a prescription (pharmacist check) */
    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PharmacyPrescriptionRecord>> verify(@PathVariable Long id) {
        String pharmacist = getCurrentPharmacistName();
        return ResponseEntity.ok(ApiResponse.success(
                verificationService.verifyPrescription(id, pharmacist), "Prescription verified"));
    }

    /** Reject a prescription */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PharmacyPrescriptionRecord>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        String pharmacist = getCurrentPharmacistName();
        return ResponseEntity.ok(ApiResponse.success(
                verificationService.rejectPrescription(id, reason, pharmacist), "Prescription rejected"));
    }

    /** Dispense a prescription — marks it DISPENSED, deducts stock, and syncs back to clinical record */
    @PostMapping("/{id}/dispense")
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionDispensed>> dispense(
            @PathVariable Long id, 
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody(required = false) DispenseRequest request) {
        User pharmacist = getCurrentUser();
        
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            // Auto-build the dispense request based on the prescription items
            PharmacyPrescriptionRecord record = prescriptionRepository.findById(id).orElseThrow();
            request = DispenseRequest.builder().prescriptionId(id).items(new ArrayList<>()).build();
            
            for (PharmacyPrescriptionItem item : record.getItems()) {
                if (item.getMedicineId() != null) {
                    int qty = item.getPrescribedQuantity() != null ? item.getPrescribedQuantity() : 1;
                    
                    request.getItems().add(DispenseItemRequest.builder()
                            .medicineId(item.getMedicineId())
                            .quantity(qty)
                            .build());
                } else {
                    // Fallback to name search if ID is missing
                    List<Medicine> meds = medicineRepository.findByNameContainingIgnoreCase(item.getMedicationName());
                    if (!meds.isEmpty()) {
                        Medicine med = meds.get(0);
                        int qty = item.getPrescribedQuantity() != null ? item.getPrescribedQuantity() : 1;
                        
                        request.getItems().add(DispenseItemRequest.builder()
                                .medicineId(med.getId())
                                .quantity(qty)
                                .build());
                    } else {
                         throw new RuntimeException("Could not find stock for medication: " + item.getMedicationName());
                    }
                }
            }
        }
        
        request.setPrescriptionId(id);
        if (idempotencyKey != null) {
            request.setIdempotencyKey(idempotencyKey);
        }
        
        return ResponseEntity.ok(ApiResponse.success(
                pharmacyDispensingService.dispensePrescription(request, pharmacist), "Prescription dispensed"));
    }
    // ── helpers ─
    private User getCurrentUser() {
        try {
            Long userId = SecurityUtils.getCurrentUserId();
            return userRepository.findById(userId).orElseThrow();
        } catch (Exception e) {
            throw new RuntimeException("User not found");
        }
    }
    // ── helpers ─
    private String getCurrentPharmacistName() {
        try {
            Long userId = SecurityUtils.getCurrentUserId();
            return userRepository.findById(userId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Pharmacist");
        } catch (Exception e) {
            return "Pharmacist";
        }
    }
}
