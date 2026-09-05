package com.healthcare.clinic.ecommerce.controller;

import com.healthcare.clinic.ecommerce.dto.MedicineMasterDto;
import com.healthcare.clinic.ecommerce.service.DoctorMedicineService;
import com.healthcare.clinic.security.SecurityUtils;
import com.healthcare.clinic.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctor/medicines")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'PHARMACIST')")
public class DoctorMedicineController {

    private final DoctorMedicineService doctorMedicineService;

    @GetMapping
    public ResponseEntity<List<MedicineMasterDto>> getMyMedicines(
            @AuthenticationPrincipal UserPrincipal user) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(doctorMedicineService.getMedicinesByDoctor(userId));
    }

    @PostMapping
    public ResponseEntity<MedicineMasterDto> createMedicine(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody MedicineMasterDto dto) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(doctorMedicineService.createMedicine(dto, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicineMasterDto> updateMedicine(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody MedicineMasterDto dto) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(doctorMedicineService.updateMedicine(id, dto, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateMedicine(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        doctorMedicineService.deactivateMedicine(id, userId);
        return ResponseEntity.noContent().build();
    }
}
