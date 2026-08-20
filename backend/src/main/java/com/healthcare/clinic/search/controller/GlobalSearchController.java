package com.healthcare.clinic.search.controller;

import com.healthcare.clinic.search.dto.GlobalSearchResultDto;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class GlobalSearchController {

    private final UserRepository userRepository;
    private final com.healthcare.clinic.appointment.repository.AppointmentRepository appointmentRepository;
    private final com.healthcare.clinic.laboratory.repository.LabTestRequestRepository labTestRequestRepository;
    private final com.healthcare.clinic.pharmacy.repository.PrescriptionRepository prescriptionRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<GlobalSearchResultDto>> search(@RequestParam String q) {
        List<User> users = userRepository.searchByNameOrEmail(q, PageRequest.of(0, 10)).getContent();
        
        List<GlobalSearchResultDto> results = users.stream().map(u -> GlobalSearchResultDto.builder()
                .id(u.getId())
                .type(u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_PATIENT")) ? "patient" : "user")
                .title(u.getFirstName() + " " + u.getLastName())
                .subtitle(u.getEmail())
                .icon(u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_PATIENT")) ? "User" : "Activity")
                .build()).collect(Collectors.toList());

        try {
            long numericId = Long.parseLong(q.trim());
            
            // Search Appointment
            appointmentRepository.findById(numericId).ifPresent(app -> {
                results.add(GlobalSearchResultDto.builder()
                        .id(app.getId())
                        .type("appointment")
                        .title("Appointment #" + app.getId())
                        .subtitle("Patient User ID: " + app.getPatient().getUserId())
                        .icon("Calendar")
                        .build());
            });

            // Search Lab Test
            labTestRequestRepository.findById(numericId).ifPresent(lab -> {
                results.add(GlobalSearchResultDto.builder()
                        .id(lab.getId())
                        .type("lab_test")
                        .title("Lab Request #" + lab.getId())
                        .subtitle("Status: " + lab.getStatus())
                        .icon("FlaskConical")
                        .build());
            });

            // Search Prescription
            prescriptionRepository.findById(numericId).ifPresent(rx -> {
                results.add(GlobalSearchResultDto.builder()
                        .id(rx.getId())
                        .type("prescription")
                        .title("Prescription #" + rx.getId())
                        .subtitle("Status: " + rx.getStatus())
                        .icon("Pill")
                        .build());
            });
            
        } catch (NumberFormatException ignored) {
            // Not a numeric query, ignore
        }

        return ResponseEntity.ok(results);
    }
}
