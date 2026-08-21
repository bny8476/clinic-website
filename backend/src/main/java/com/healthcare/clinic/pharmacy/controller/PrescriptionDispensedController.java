package com.healthcare.clinic.pharmacy.controller;
import com.healthcare.clinic.inventory.entity.BaseEntity;
import com.healthcare.clinic.audit.annotation.AuditableAction;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.pharmacy.entity.PrescriptionDispensed;
import com.healthcare.clinic.pharmacy.repository.PrescriptionDispensedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.ZonedDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/dispensed")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PHARMACIST') or hasRole('SUPER_ADMIN')")
public class PrescriptionDispensedController {

    private final PrescriptionDispensedRepository dispensedRepository;

    @GetMapping
    @AuditableAction(module = "PHARMACY", action = "VIEW", resourceType = "PrescriptionDispensed", sensitivityLevel = "NORMAL")
    public ResponseEntity<List<PrescriptionDispensed>> getMyDispensedPrescriptions(@AuthenticationPrincipal User pharmacist) {
        return ResponseEntity.ok(dispensedRepository.findByPharmacistId(pharmacist.getId()));
    }

    @PostMapping
    @AuditableAction(module = "PHARMACY", action = "DISPENSE", resourceType = "PrescriptionDispensed", sensitivityLevel = "HIGH")
    public ResponseEntity<PrescriptionDispensed> dispensePrescription(@RequestBody PrescriptionDispensed dispensed, @AuthenticationPrincipal User pharmacist) {
        dispensed.setPharmacistId(pharmacist.getId());
        dispensed.setDispensedAt(ZonedDateTime.now());
        // In a real system, you would loop through items, reduce inventory from batches, and save items
        return ResponseEntity.ok(dispensedRepository.save(dispensed));
    }
}
