package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.patient.dto.TimelineEventDTO;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.patient.service.PatientTimelineService;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/patient/timeline")
@RequiredArgsConstructor
public class PatientTimelineController {

    private final PatientTimelineService patientTimelineService;
    private final PatientProfileRepository patientProfileRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<List<TimelineEventDTO>> getMyTimeline() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        
        Optional<PatientProfile> patientOpt = patientProfileRepository.findByUserId(currentUserId);
        if (patientOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        
        Long patientId = patientOpt.get().getId();
        
        List<TimelineEventDTO> timeline = patientTimelineService.getTimelineForPatient(patientId);
        
        return ResponseEntity.ok(timeline);
    }
    
    @GetMapping("/{patientId}")
    @PreAuthorize("hasAnyAuthority('ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_ADMIN')")
    public ResponseEntity<List<TimelineEventDTO>> getPatientTimeline(@PathVariable Long patientId) {
        List<TimelineEventDTO> timeline = patientTimelineService.getTimelineForPatient(patientId);
        return ResponseEntity.ok(timeline);
    }
}
