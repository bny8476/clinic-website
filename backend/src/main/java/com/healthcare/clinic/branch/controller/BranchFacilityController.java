package com.healthcare.clinic.branch.controller;

import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/branch/facilities")
@RequiredArgsConstructor
public class BranchFacilityController {

    private final BranchRepository branchRepository;

    // In-memory maintenance and audit state
    private static final List<Map<String, Object>> workOrders = new ArrayList<>();
    private static final List<Map<String, Object>> equipmentList = new ArrayList<>();
    private static final List<Map<String, Object>> safetyAudits = new ArrayList<>();

    static {
        // Maintenance work orders
        workOrders.add(createOrder(1L, "HVAC System Cleanroom Filter (Ward 2)", "General Ward & ICU", "Airflow velocity dropping below 12 ACH; HEPA filter replacement required.", "HIGH", "IN_PROGRESS", "NextGen HVAC Services", LocalDate.now().minusDays(2).toString()));
        workOrders.add(createOrder(2L, "Elevator B Routine Safety Inspection", "Central Core", "Quarterly hydraulic elevator hoistway and emergency stop test.", "MEDIUM", "SCHEDULED", "Otis Field Engineering", LocalDate.now().plusDays(2).toString()));
        workOrders.add(createOrder(3L, "Cryogenic Oxygen Manifold Sensor Calibration", "Central Plant", "Dual-manifold gas sensor annual recalibration and leak detection testing.", "CRITICAL", "IN_PROGRESS", "Linde Healthcare Technical Team", LocalDate.now().minusDays(1).toString()));
        workOrders.add(createOrder(4L, "Autoclave Sterilizer 3 Door Gasket Replacement", "CSSD (Sterilization)", "Preventative seal replacement after 2,500 sterilization cycles.", "LOW", "RESOLVED", "Hospital Bio-Med In-house", LocalDate.now().minusDays(4).toString()));

        // Biomedical equipment
        equipmentList.add(createEquipment(101L, "GE Revolution 128-Slice CT Scanner", "EQ-RAD-01", "Radiology & Imaging", "OPERATIONAL", 99.4, "2026-08-15", "2027-02-15"));
        equipmentList.add(createEquipment(102L, "Hamilton-C6 Mechanical Ventilator #1", "EQ-ICU-04", "ICU Bay 3", "OPERATIONAL", 99.8, "2026-09-01", "2027-03-01"));
        equipmentList.add(createEquipment(103L, "Philips HeartStart XL+ Defibrillator", "EQ-EMG-02", "Emergency Triage", "OPERATIONAL", 100.0, "2026-10-10", "2027-04-10"));
        equipmentList.add(createEquipment(104L, "Fresenius 5008S Dialysis Machine #2", "EQ-NEP-03", "Nephrology / Dialysis", "CALIBRATION_DUE", 97.2, "2026-05-12", "2026-11-28"));
        equipmentList.add(createEquipment(105L, "Olympus EVIS EXERA III Endoscopy Tower", "EQ-GAS-01", "Endoscopy Suite", "OPERATIONAL", 99.1, "2026-07-20", "2027-01-20"));
        equipmentList.add(createEquipment(106L, "Dräger Fabius Plus Anaesthesia Workstation", "EQ-OT-02", "Operation Theatre 2", "OPERATIONAL", 99.6, "2026-08-30", "2027-02-28"));

        // Safety & Compliance Audits
        safetyAudits.add(createAudit(201L, "NABH Fire Safety & Sprinkler Clearance", "State Fire Services", 100, "COMPLIANT", "2026-09-10", "2027-09-10"));
        safetyAudits.add(createAudit(202L, "Biomedical Waste Management PCB SLA", "State Pollution Control Board", 98, "COMPLIANT", "2026-10-05", "2027-10-05"));
        safetyAudits.add(createAudit(203L, "AERB Diagnostic Radiation Shielding", "Atomic Energy Regulatory Board", 100, "COMPLIANT", "2026-06-15", "2027-06-15"));
        safetyAudits.add(createAudit(204L, "Medical Gas Pipeline System (MGPS) Purity", "ISO 7396-1 Auditor", 99, "COMPLIANT", "2026-10-20", "2027-04-20"));
        safetyAudits.add(createAudit(205L, "Reverse Osmosis Dialysis Water Purity", "Microbiological Testing Lab", 99, "COMPLIANT", "2026-11-01", "2027-05-01"));
    }

    private static Map<String, Object> createOrder(Long id, String title, String location, String description, String priority, String status, String technician, String date) {
        Map<String, Object> o = new HashMap<>();
        o.put("id", id);
        o.put("title", title);
        o.put("location", location);
        o.put("description", description);
        o.put("priority", priority);
        o.put("status", status);
        o.put("technician", technician);
        o.put("reportedDate", date);
        return o;
    }

    private static Map<String, Object> createEquipment(Long id, String name, String assetTag, String department, String status, double uptime, String lastCalib, String nextCalib) {
        Map<String, Object> eq = new HashMap<>();
        eq.put("id", id);
        eq.put("name", name);
        eq.put("assetTag", assetTag);
        eq.put("department", department);
        eq.put("status", status);
        eq.put("uptime", uptime);
        eq.put("lastCalibration", lastCalib);
        eq.put("nextCalibration", nextCalib);
        return eq;
    }

    private static Map<String, Object> createAudit(Long id, String name, String authority, int score, String status, String auditDate, String expiryDate) {
        Map<String, Object> a = new HashMap<>();
        a.put("id", id);
        a.put("name", name);
        a.put("authority", authority);
        a.put("score", score);
        a.put("status", status);
        a.put("auditDate", auditDate);
        a.put("expiryDate", expiryDate);
        return a;
    }

    /**
     * Get overall facility summary metrics
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_BRANCH_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_STAFF') or isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getFacilitySummary(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String branch
    ) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("facilityUptime", 98.9);
        summary.put("totalCriticalAssets", equipmentList.size());
        summary.put("activeWorkOrders", workOrders.stream().filter(w -> !"RESOLVED".equalsIgnoreCase((String) w.get("status"))).count());
        summary.put("safetyComplianceScore", 99.2);

        Map<String, Object> utilities = new HashMap<>();
        utilities.put("powerSystems", "OPERATIONAL");
        utilities.put("waterSupply", "OPERATIONAL");
        utilities.put("medicalGases", "OPERATIONAL");
        utilities.put("hvacPressure", "OPERATIONAL");
        utilities.put("itNetwork", "DEGRADED");
        summary.put("utilities", utilities);

        return ResponseEntity.ok(summary);
    }

    /**
     * Get maintenance work orders
     */
    @GetMapping("/maintenance")
    @PreAuthorize("hasAnyAuthority('ROLE_BRANCH_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_STAFF') or isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getMaintenanceOrders(
            @RequestParam(required = false) String status
    ) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(workOrders);
        }
        List<Map<String, Object>> filtered = workOrders.stream()
                .filter(w -> status.equalsIgnoreCase((String) w.get("status")))
                .toList();
        return ResponseEntity.ok(filtered);
    }

    /**
     * Create maintenance work order
     */
    @PostMapping("/maintenance")
    @PreAuthorize("hasAnyAuthority('ROLE_BRANCH_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_STAFF') or isAuthenticated()")
    public ResponseEntity<Map<String, Object>> createMaintenanceOrder(@RequestBody Map<String, Object> req) {
        Long id = System.currentTimeMillis();
        String title = (String) req.getOrDefault("title", "Equipment Issue");
        String location = (String) req.getOrDefault("location", "Main Ward");
        String description = (String) req.getOrDefault("description", "Reported by branch supervisor");
        String priority = (String) req.getOrDefault("priority", "HIGH");
        String technician = (String) req.getOrDefault("technician", "On-Call Engineering Team");

        Map<String, Object> order = createOrder(id, title, location, description, priority, "IN_PROGRESS", technician, LocalDate.now().toString());
        workOrders.add(0, order);
        return ResponseEntity.ok(order);
    }

    /**
     * Update maintenance work order status
     */
    @PatchMapping("/maintenance/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_BRANCH_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_STAFF') or isAuthenticated()")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusMap
    ) {
        String newStatus = statusMap.getOrDefault("status", "RESOLVED");
        for (Map<String, Object> o : workOrders) {
            if (o.get("id").equals(id)) {
                o.put("status", newStatus.toUpperCase());
                return ResponseEntity.ok(o);
            }
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Get critical medical equipment list
     */
    @GetMapping("/equipment")
    @PreAuthorize("hasAnyAuthority('ROLE_BRANCH_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_STAFF') or isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getEquipmentList() {
        return ResponseEntity.ok(equipmentList);
    }

    /**
     * Get safety compliance and regulatory audits
     */
    @GetMapping("/safety")
    @PreAuthorize("hasAnyAuthority('ROLE_BRANCH_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_STAFF') or isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getSafetyAudits() {
        return ResponseEntity.ok(safetyAudits);
    }

    /**
     * Renew safety audit
     */
    @PatchMapping("/safety/{id}/renew")
    @PreAuthorize("hasAnyAuthority('ROLE_BRANCH_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN') or isAuthenticated()")
    public ResponseEntity<Map<String, Object>> renewSafetyAudit(@PathVariable Long id) {
        for (Map<String, Object> a : safetyAudits) {
            if (a.get("id").equals(id)) {
                a.put("auditDate", LocalDate.now().toString());
                a.put("expiryDate", LocalDate.now().plusYears(1).toString());
                a.put("status", "COMPLIANT");
                return ResponseEntity.ok(a);
            }
        }
        return ResponseEntity.notFound().build();
    }
}
