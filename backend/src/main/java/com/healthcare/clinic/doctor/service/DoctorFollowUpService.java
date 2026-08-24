package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.doctor.dto.FollowUpResponse;
import com.healthcare.clinic.doctor.entity.DoctorFollowUp;
import com.healthcare.clinic.doctor.entity.FollowUpStatus;
import com.healthcare.clinic.doctor.repository.DoctorFollowUpRepository;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorFollowUpService {

    private final DoctorFollowUpRepository followUpRepository;
    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    @Transactional
    public void updateStatuses() {
        // Find only active follow-ups to avoid memory overhead
        List<FollowUpStatus> activeStatuses = List.of(FollowUpStatus.PENDING, FollowUpStatus.DUE_TODAY, FollowUpStatus.OVERDUE);
        List<DoctorFollowUp> activeFollowUps = followUpRepository.findByStatusIn(activeStatuses);
        LocalDate today = LocalDate.now();
        
        for (DoctorFollowUp followUp : activeFollowUps) {
            if (followUp.getFollowUpDate().isBefore(today)) {
                followUp.setStatus(FollowUpStatus.OVERDUE);
            } else if (followUp.getFollowUpDate().isEqual(today)) {
                followUp.setStatus(FollowUpStatus.DUE_TODAY);
            } else {
                followUp.setStatus(FollowUpStatus.PENDING);
            }
        }
        followUpRepository.saveAll(activeFollowUps);
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> getFollowUpsForDoctor(Long userId) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(userId).orElse(null);
        if (doctor == null) return List.of();
        
        return followUpRepository.findByDoctorIdOrderByFollowUpDateAsc(doctor.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private FollowUpResponse mapToResponse(DoctorFollowUp followUp) {
        User patient = userRepository.findById(followUp.getPatientId()).orElse(null);
        String patientName = patient != null ? patient.getFirstName() + " " + patient.getLastName() : "Unknown";
        String phone = patient != null ? patient.getPhoneNumber() : "N/A";

        return FollowUpResponse.builder()
                .id(followUp.getId())
                .patientName(patientName)
                .phone(phone)
                .followUpDate(followUp.getFollowUpDate().toString())
                .reason(followUp.getReason())
                .status(followUp.getStatus().name())
                .build();
    }
}
