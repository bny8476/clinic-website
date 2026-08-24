package com.healthcare.clinic.doctor.medicine.controller;

import com.healthcare.clinic.doctor.medicine.dto.DoctorMedicineDto;
import com.healthcare.clinic.doctor.medicine.dto.MedicineOrderRequest;
import com.healthcare.clinic.doctor.medicine.service.PatientMedicineService;
import com.healthcare.clinic.finance.service.StripePaymentService;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patient/medicines")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_ADMIN')")
public class PatientMedicineController {

    private final PatientMedicineService patientMedicineService;
    private final PatientProfileRepository patientProfileRepository;
    private final StripePaymentService stripePaymentService;

    @GetMapping
    public List<DoctorMedicineDto> getAvailableMedicines() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) return List.of();
        return patientMedicineService.getAvailableMedicines(currentUserId);
    }

    @PostMapping("/order")
    public Map<String, String> orderMedicines(@RequestBody MedicineOrderRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Long patientProfileId = getPatientProfileIdForUserId(currentUserId);
        
        Long orderId = patientMedicineService.createOrder(patientProfileId, request);
        
        String checkoutUrl = stripePaymentService.createMedicineCheckoutSession(orderId);
        
        return Map.of("checkoutUrl", checkoutUrl);
    }

    private Long getPatientProfileIdForUserId(Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient profile not found"))
                .getId();
    }
}
