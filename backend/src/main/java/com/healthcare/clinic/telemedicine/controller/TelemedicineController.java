package com.healthcare.clinic.telemedicine.controller;

import com.healthcare.clinic.telemedicine.entity.TeleconsultSession;
import com.healthcare.clinic.telemedicine.service.VideoProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/telemedicine")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class TelemedicineController {

    private final VideoProviderService videoProviderService;

    @PostMapping("/rooms")
    public ResponseEntity<TeleconsultSession> createRoom(@RequestParam Long appointmentId, @RequestParam Long tenantId) {
        return ResponseEntity.ok(videoProviderService.createRoom(appointmentId, tenantId));
    }

    @GetMapping("/rooms/appointment/{appointmentId}")
    public ResponseEntity<TeleconsultSession> getSessionByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(videoProviderService.getSessionByAppointment(appointmentId));
    }
}
