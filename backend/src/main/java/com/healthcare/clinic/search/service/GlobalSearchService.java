package com.healthcare.clinic.search.service;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;
import com.healthcare.clinic.pharmacy.entity.Medicine;
import com.healthcare.clinic.pharmacy.repository.MedicineRepository;
import com.healthcare.clinic.pharmacy.repository.PrescriptionRepository;
import com.healthcare.clinic.search.dto.GlobalSearchResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GlobalSearchService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final LabTestRequestRepository labTestRequestRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicineRepository medicineRepository;

    public List<GlobalSearchResultDto> performGlobalSearch(String query) {
        List<GlobalSearchResultDto> results = new ArrayList<>();
        if (query == null || query.trim().length() < 2) {
            return results;
        }
        
        String q = query.trim();

        // 1. Search Users (and Patients since Patients are Users)
        List<User> users = userRepository.searchByNameOrEmail(q, PageRequest.of(0, 10)).getContent();
        users.forEach(u -> results.add(GlobalSearchResultDto.builder()
                .id(u.getId())
                .type(u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_PATIENT")) ? "patient" : "user")
                .title(u.getFirstName() + " " + u.getLastName())
                .subtitle(u.getEmail())
                .icon(u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_PATIENT")) ? "User" : "Activity")
                .build()));

        // 2. Search Medicines
        medicineRepository.findByNameContainingIgnoreCase(q).stream().limit(5).forEach(m -> {
            results.add(GlobalSearchResultDto.builder()
                    .id(m.getId())
                    .type("medicine")
                    .title(m.getName())
                    .subtitle("Manufacturer: " + m.getManufacturer())
                    .icon("Pill")
                    .build());
        });

        // 3. Try parsing as numeric ID for specific entity lookups
        try {
            long numericId = Long.parseLong(q);
            
            // Appointment
            appointmentRepository.findById(numericId).ifPresent(app -> {
                results.add(GlobalSearchResultDto.builder()
                        .id(app.getId())
                        .type("appointment")
                        .title("Appointment #" + app.getId())
                        .subtitle(app.getSlot() != null ? app.getSlot().getStartTime().toString() : "No time set")
                        .icon("Calendar")
                        .build());
            });

            // Lab Test
            labTestRequestRepository.findById(numericId).ifPresent(lab -> {
                results.add(GlobalSearchResultDto.builder()
                        .id(lab.getId())
                        .type("lab_test")
                        .title("Lab Request #" + lab.getId())
                        .subtitle("Status: " + lab.getStatus())
                        .icon("FlaskConical")
                        .build());
            });

            // Prescription
            prescriptionRepository.findById(numericId).ifPresent(rx -> {
                results.add(GlobalSearchResultDto.builder()
                        .id(rx.getId())
                        .type("prescription")
                        .title("Prescription #" + rx.getId())
                        .subtitle("Status: " + rx.getStatus())
                        .icon("FileText")
                        .build());
            });
            
        } catch (NumberFormatException ignored) {
            // Not a numeric query, ignore specific ID lookups
        }

        return results;
    }
}
