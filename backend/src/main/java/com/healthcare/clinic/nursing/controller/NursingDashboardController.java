package com.healthcare.clinic.nursing.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.nursing.dto.NurseAssignmentResponse;
import com.healthcare.clinic.nursing.entity.NursePatientAssignment;
import com.healthcare.clinic.nursing.repository.NursePatientAssignmentRepository;
import com.healthcare.clinic.nursing.service.NursingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/nursing")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN','ROLE_NURSE')")
public class NursingDashboardController {

    private final NursePatientAssignmentRepository assignmentRepository;
    private final NursingService nursingService;

    @GetMapping("/assignments")
    public List<NursePatientAssignment> getMyAssignments(@AuthenticationPrincipal UserPrincipal user) {
        return assignmentRepository.findByNurseIdAndStatus(user.getUserId(), "ACTIVE");
    }

    @GetMapping("/assignments/op")
    public List<NurseAssignmentResponse> getOPAssignments(@AuthenticationPrincipal UserPrincipal user) {
        return nursingService.getOPAssignments(user.getUserId());
    }

    @GetMapping("/recent-activity")
    public List<com.healthcare.clinic.nursing.dto.NursingActivityResponse> getRecentActivity(@AuthenticationPrincipal UserPrincipal user) {
        return nursingService.getRecentActivity(user.getUserId());
    }

    @org.springframework.web.bind.annotation.PostMapping("/op-token")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> generateOPToken(
            @AuthenticationPrincipal UserPrincipal user,
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Long> payload) {
        Long patientId = payload.get("patientId");
        if (patientId == null) {
            return org.springframework.http.ResponseEntity.badRequest().build();
        }
        return org.springframework.http.ResponseEntity.ok(nursingService.generateOPToken(user.getUserId(), patientId));
    }
}
