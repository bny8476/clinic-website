package com.healthcare.clinic.ambulance.controller;

import com.healthcare.clinic.ambulance.entity.EmergencyPatientRecord;
import com.healthcare.clinic.ambulance.service.AmbulanceClinicalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/ambulance/clinical")
@PreAuthorize("hasAuthority('ROLE_AMBULANCE') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class AmbulanceClinicalController {
    private final AmbulanceClinicalService clinicalService;

    @PostMapping("/record")
    public ResponseEntity<EmergencyPatientRecord> saveRecord(@RequestBody EmergencyPatientRecord record) {
        return ResponseEntity.ok(clinicalService.saveRecord(record));
    }
}
