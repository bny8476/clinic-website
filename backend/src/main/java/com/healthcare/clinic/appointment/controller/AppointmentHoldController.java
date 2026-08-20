package com.healthcare.clinic.appointment.controller;

import com.healthcare.clinic.appointment.service.AppointmentHoldService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments/hold")
@PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class AppointmentHoldController {

    private final AppointmentHoldService holdService;

    @PostMapping
    public ResponseEntity<?> holdSlot(@RequestBody @Valid HoldRequest request) {
        String holdId = holdService.holdSlot(request.getDoctorId(), request.getSlotStart());
        if (holdId == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "This slot was just taken. Please refresh availability and try another."));
        }
        return ResponseEntity.ok(Map.of("holdId", holdId));
    }

    @DeleteMapping("/{holdId}")
    public ResponseEntity<?> releaseHold(
            @PathVariable String holdId,
            @RequestParam Long doctorId,
            @RequestParam String slotStart) {
        
        holdService.releaseHold(doctorId, slotStart, holdId);
        return ResponseEntity.ok().build();
    }

    @Data
    public static class HoldRequest {
        @NotNull
        private Long doctorId;
        @NotNull
        private String slotStart; // ISO format string expected
    }
}
