package com.healthcare.clinic.laboratory.controller;

import com.healthcare.clinic.laboratory.entity.LabInventoryItem;
import com.healthcare.clinic.laboratory.entity.LabQualityControl;
import com.healthcare.clinic.laboratory.service.LabOperationalService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/lab/operations", "/api/lab/operations"})
@RequiredArgsConstructor
public class LabOperationalController {

    private final LabOperationalService operationalService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_BRANCH_ADMIN', 'ROLE_LAB_TECH', 'ROLE_LAB_TECHNICIAN', 'ROLE_LAB_MANAGER', 'ROLE_LAB', 'ROLE_PATHOLOGIST', 'ROLE_DOCTOR', 'ROLE_NURSE')")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@RequestParam(required = false, defaultValue = "1") Long branchId) {
        return ResponseEntity.ok(operationalService.getDashboardStats(branchId));
    }

    @PostMapping("/inventory/deduct")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_TECH')")
    public ResponseEntity<LabInventoryItem> deductInventory(
            @RequestParam String sku,
            @RequestParam int quantity) {
        return ResponseEntity.ok(operationalService.deductInventory(sku, quantity));
    }

    @PostMapping("/qc/record")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_TECH')")
    public ResponseEntity<LabQualityControl> recordQc(
            @RequestParam Long testCatalogId,
            @RequestParam String status,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(operationalService.recordQualityControl(testCatalogId, status, notes, user));
    }
}
