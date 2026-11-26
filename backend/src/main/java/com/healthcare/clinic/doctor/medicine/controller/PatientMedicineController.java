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
@RequestMapping("/api/patient/medicines")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_ADMIN')")
public class PatientMedicineController {

    private final PatientMedicineService patientMedicineService;
    private final PatientProfileRepository patientProfileRepository;

    @GetMapping
    public List<DoctorMedicineDto> getAvailableMedicines() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) return List.of();
        return patientMedicineService.getAvailableMedicines(currentUserId);
    }

    @PostMapping({"/order", "/orders"})
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
        if (userId == null) return null;
        return patientProfileRepository.findByUserId(userId)
                .map(PatientProfile::getId)
                .orElseGet(() -> {
                    return patientProfileRepository.findById(userId)
                            .map(PatientProfile::getId)
                            .orElse(null);
                });
    }
}
