package com.healthcare.clinic.patient.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.dto.TimelineEventDTO;
import com.healthcare.clinic.patient.service.HealthTimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patient/timeline")
@PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class HealthTimelineController {

    private final HealthTimelineService healthTimelineService;

    @GetMapping
    public ResponseEntity<List<TimelineEventDTO>> getTimeline(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(healthTimelineService.getTimelineEvents(user));
    }
}
