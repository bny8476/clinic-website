package com.healthcare.clinic.doctor.medicine.controller;

import com.healthcare.clinic.doctor.medicine.dto.DoctorMedicineSaleRequestDto;
import com.healthcare.clinic.doctor.medicine.dto.DoctorRecommendationRequestDto;
import com.healthcare.clinic.doctor.medicine.dto.DoctorRecommendationResponseDto;
import com.healthcare.clinic.doctor.medicine.dto.MedicineOrderResponseDto;
import com.healthcare.clinic.doctor.medicine.service.DoctorMedicineRecommendationService;
import com.healthcare.clinic.doctor.medicine.service.DoctorMedicineSalesService;
import com.healthcare.clinic.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DoctorMedicineSalesController {

    private final DoctorMedicineSalesService salesService;
    private final DoctorMedicineRecommendationService recommendationService;

    // ── Canonical Doctor Recommendations Endpoints ─────────────────────────────
    @PostMapping("/api/doctor/patients/{patientId}/medicine-recommendations")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<DoctorRecommendationResponseDto>> createRecommendations(
            @PathVariable Long patientId,
            @Valid @RequestBody DoctorRecommendationRequestDto request) {
        request.setPatientId(patientId);
        Long doctorUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(recommendationService.createRecommendations(doctorUserId, request));
    }

    @GetMapping("/api/doctor/patients/{patientId}/medicine-recommendations")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<DoctorRecommendationResponseDto>> getDoctorPatientRecommendations(@PathVariable Long patientId) {
        Long doctorUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(recommendationService.getDoctorPatientRecommendations(doctorUserId, patientId));
    }

    @GetMapping("/api/patient/medicine-recommendations/canonical")
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<DoctorRecommendationResponseDto>> getCanonicalPatientRecommendations() {
        Long patientUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(recommendationService.getPatientRecommendations(patientUserId));
    }

    @PostMapping("/api/patient/medicine-recommendations/{id}/add-to-cart")
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<DoctorRecommendationResponseDto> addRecommendationToCartCanonical(@PathVariable Long id) {
        Long patientUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(recommendationService.addRecommendationToCart(id, patientUserId));
    }

    // ── Doctor Medicine Sales Endpoints ────────────────────────────────────────
    @PostMapping("/api/doctor/medicine-sales")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<MedicineOrderResponseDto> createDoctorMedicineOrder(
            @Valid @RequestBody DoctorMedicineSaleRequestDto request) {
        Long doctorUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(salesService.createDoctorMedicineOrder(doctorUserId, request));
    }

    @GetMapping("/api/doctor/medicine-sales")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<MedicineOrderResponseDto>> getDoctorMedicineSales() {
        Long doctorUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(salesService.getDoctorMedicineSales(doctorUserId));
    }

    @GetMapping("/api/doctor/medicine-sales/{id}")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<MedicineOrderResponseDto> getDoctorMedicineSaleDetails(@PathVariable Long id) {
        return ResponseEntity.ok(salesService.getOrderDetails(id));
    }

    // ── Patient E-Commerce / Recommendations Endpoints ─────────────────────────
    @GetMapping("/api/patient/medicine-recommendations")
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<MedicineOrderResponseDto>> getPatientRecommendations() {
        Long patientUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(salesService.getPatientRecommendations(patientUserId));
    }

    @GetMapping({"/api/patient/medicine-orders", "/api/patient/medicines/my-orders"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MedicineOrderResponseDto>> getPatientMedicineOrders() {
        Long patientUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(salesService.getPatientMedicineOrders(patientUserId));
    }

    @PostMapping("/api/patient/medicine-orders/{id}/cart")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MedicineOrderResponseDto> addRecommendationToCart(@PathVariable Long id) {
        Long patientUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(salesService.addRecommendationToCart(id, patientUserId));
    }

    @PostMapping("/api/medicine-orders/{id}/checkout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MedicineOrderResponseDto> checkoutOrder(@PathVariable Long id) {
        Long patientUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(salesService.checkoutOrder(id, patientUserId));
    }

    @PostMapping("/api/medicine-orders/{id}/payment")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MedicineOrderResponseDto> processPayment(@PathVariable Long id) {
        Long patientUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(salesService.processPayment(id, patientUserId));
    }

    // ── Pharmacy Fulfillment Endpoints ─────────────────────────────────────────
    @GetMapping({"/api/pharmacy/medicine-orders", "/api/pharmacy/orders"})
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','PHARMACIST','ROLE_PHARMACY_STAFF','PHARMACY_STAFF','ROLE_SUPERVISOR','SUPERVISOR','ROLE_SYSTEM_ADMIN','SYSTEM_ADMIN','ROLE_ADMIN','ADMIN','ROLE_SUPER_ADMIN','SUPER_ADMIN','ROLE_DOCTOR','DOCTOR','ROLE_STOREKEEPER')")
    public ResponseEntity<List<MedicineOrderResponseDto>> getPharmacyMedicineOrders(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(salesService.getPharmacyOrders(status));
    }

    @PutMapping({"/api/pharmacy/medicine-orders/{id}/status", "/api/pharmacy/orders/{id}/status"})
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','PHARMACIST','ROLE_PHARMACY_STAFF','PHARMACY_STAFF','ROLE_SUPERVISOR','SUPERVISOR','ROLE_SYSTEM_ADMIN','SYSTEM_ADMIN','ROLE_ADMIN','ADMIN','ROLE_SUPER_ADMIN','SUPER_ADMIN','ROLE_DOCTOR','DOCTOR','ROLE_STOREKEEPER')")
    public ResponseEntity<MedicineOrderResponseDto> updatePharmacyOrderStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        Long actionUserId = SecurityUtils.getCurrentUserId();
        String status = payload != null ? payload.get("status") : "COMPLETED";
        return ResponseEntity.ok(salesService.updateOrderStatusByIdOrNumber(id, status, actionUserId));
    }
}
