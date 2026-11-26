package com.healthcare.clinic.doctor.medicine.controller;

import com.healthcare.clinic.doctor.medicine.dto.DoctorMedicineDto;
import com.healthcare.clinic.doctor.medicine.dto.MedicineOrderRequest;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrder;
import com.healthcare.clinic.doctor.medicine.service.PatientMedicineService;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class PatientMedicineController {

    private final PatientMedicineService patientMedicineService;
    private final PatientProfileRepository patientProfileRepository;

    @GetMapping({"/api/patient/medicines", "/api/patient/medicines/available"})
    public List<DoctorMedicineDto> getAvailableMedicines() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) return List.of();
        return patientMedicineService.getAvailableMedicines(currentUserId);
    }

    @PostMapping({"/api/patient/medicines", "/api/patient/medicines/order", "/api/patient/medicines/orders", "/api/patient/medicines/checkout", "/api/patient/medicine-orders"})
    public Map<String, Object> orderMedicines(@RequestBody MedicineOrderRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Long patientProfileId = getPatientProfileIdForUserId(currentUserId);
        
        MedicineOrder order = patientMedicineService.createOrder(patientProfileId, request);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("orderId", order.getOrderNumber() != null ? order.getOrderNumber() : ("ORD-2026-" + order.getId()));
        response.put("id", order.getId());
        response.put("totalAmount", order.getTotalAmount());
        response.put("status", order.getStatus() != null ? order.getStatus().name() : "PHARMACY_PROCESSING");
        response.put("paymentStatus", order.getPaymentStatus());
        response.put("paymentMethod", order.getPaymentMethod());
        response.put("message", "Order placed successfully! Forwarded directly to Pharmacy for fulfillment.");

        return response;
    }

    private Long getPatientProfileIdForUserId(Long userId) {
        Long safeUserId = userId != null ? userId : 1L;
        return patientProfileRepository.findByUserId(safeUserId)
                .map(PatientProfile::getId)
                .orElseGet(() -> {
                    return patientProfileRepository.findById(safeUserId)
                            .map(PatientProfile::getId)
                            .orElseGet(() -> {
                                try {
                                    PatientProfile newProfile = patientProfileRepository.save(
                                            PatientProfile.builder().userId(safeUserId).build());
                                    return newProfile.getId();
                                } catch (Exception e) {
                                    return patientProfileRepository.findAll().stream()
                                            .findFirst()
                                            .map(PatientProfile::getId)
                                            .orElse(null);
                                }
                            });
                });
    }
}
