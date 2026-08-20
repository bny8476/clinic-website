package com.healthcare.clinic.homevisit.controller;

import com.healthcare.clinic.homevisit.entity.HomeVisitAssignment;
import com.healthcare.clinic.patient.entity.HomeVisitRequest;
import com.healthcare.clinic.homevisit.service.HomeVisitDispatcherService;
import com.healthcare.clinic.homevisit.repository.HomeVisitRequestRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZonedDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/home-visit")
@RequiredArgsConstructor
public class HomeVisitController {

    private final HomeVisitDispatcherService dispatcherService;
    private final HomeVisitRequestRepository requestRepository;
    private final PatientProfileRepository patientProfileRepository;

    @PostMapping("/requests")
    public ResponseEntity<HomeVisitRequest> createRequest(@RequestBody HomeVisitRequest request) {
        return ResponseEntity.ok(dispatcherService.createRequest(request));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<HomeVisitRequest>> getRequests() {
        return ResponseEntity.ok(dispatcherService.getAllRequests());
    }

    @PostMapping("/requests/{id}/assign")
    public ResponseEntity<HomeVisitAssignment> assignStaff(@PathVariable Long id, @RequestParam Long staffId, @RequestParam Long tenantId) {
        return ResponseEntity.ok(dispatcherService.assignStaff(id, staffId, tenantId));
    }

    @GetMapping("/my-requests")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<List<HomeVisitRequest>> getMyRequests() {
        Long userId = SecurityUtils.getCurrentUserId();
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient profile not found"));
        return ResponseEntity.ok(requestRepository.findByPatientIdOrderByCreatedAtDesc(profile.getId()));
    }

    @PostMapping("/request")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<HomeVisitRequest> createRequest(@RequestBody CreateVisitRequest dto) {
        Long userId = SecurityUtils.getCurrentUserId();
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient profile not found"));

        HomeVisitRequest request = HomeVisitRequest.builder()
                .patient(profile)
                .preferredDate(dto.getRequestDate() != null ? dto.getRequestDate().toLocalDate() : java.time.LocalDate.now())
                .status("PENDING")
                .address(dto.getAddress())
                .reasonForVisit(dto.getNotes())
                .build();

        return ResponseEntity.ok(requestRepository.save(request));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_DOCTOR')")
    public ResponseEntity<List<HomeVisitRequest>> getAllRequests() {
        return ResponseEntity.ok(requestRepository.findAll());
    }

    @PutMapping("/{requestId}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_NURSE')")
    public ResponseEntity<HomeVisitRequest> updateRequestStatus(@PathVariable Long requestId, @RequestParam String status) {
        HomeVisitRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        request.setStatus(status);
        return ResponseEntity.ok(requestRepository.save(request));
    }

    @Data
    public static class CreateVisitRequest {
        private String address;
        private String notes;
        private ZonedDateTime requestDate;
    }
}
