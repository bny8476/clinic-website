package com.healthcare.clinic.reception.service;

import com.healthcare.clinic.identity.entity.Role;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.RoleRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class ReceptionPatientService {

    private final PatientProfileRepository patientProfileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Map<String, Object> registerPatient(Map<String, Object> request) {
        String phone = (String) request.get("phone");
        String email = (String) request.get("email");

        if (phone == null || phone.trim().isEmpty()) {
            throw new IllegalArgumentException("Phone number is required");
        }

        if (userRepository.findByPhoneNumber(phone).isPresent()) {
            throw new IllegalArgumentException("A patient with this phone number already exists.");
        }

        if (email != null && !email.trim().isEmpty()) {
            if (userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("A patient with this email already exists.");
            }
        } else {
            email = phone.replaceAll("[^0-9]", "") + "@clinic.local";
        }

        String firstName = (String) request.get("firstName");
        String lastName = (String) request.get("lastName");

        User user = User.builder()
                .firstName(firstName != null ? firstName : "")
                .lastName(lastName != null ? lastName : "")
                .email(email)
                .phoneNumber(phone)
                .passwordHash(passwordEncoder.encode(phone))
                .build();

        Set<Role> roles = new HashSet<>();
        Role patientRole = roleRepository.findByName("ROLE_PATIENT")
                .orElseThrow(() -> new RuntimeException("Role ROLE_PATIENT not found"));
        roles.add(patientRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        int year = java.time.Year.now().getValue();
        long count = patientProfileRepository.count() + 1;
        String opNumber = String.format("OP-%d-%04d", year, count);

        PatientProfile profile = PatientProfile.builder()
                .userId(savedUser.getId())
                .branchId(1L)
                .opNumber(opNumber)
                .gender((String) request.get("gender"))
                .bloodGroup((String) request.get("bloodGroup"))
                .emergencyContactName("Emergency Contact")
                .emergencyContactPhone((String) request.get("emergencyContact"))
                .address((String) request.get("address"))
                .medicalHistorySummary("Reason for visit: " + request.get("reasonForVisit"))
                .build();

        String ageStr = (String) request.get("age");
        if (ageStr != null && !ageStr.trim().isEmpty()) {
            try {
                int age = Integer.parseInt(ageStr);
                profile.setDateOfBirth(LocalDate.now().minusYears(age));
            } catch (NumberFormatException e) {
                // Ignore
            }
        }

        PatientProfile savedProfile = patientProfileRepository.save(profile);

        return mapToSearchResult(savedProfile, savedUser);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchPatients(String query, String opNumber) {
        if (opNumber != null && !opNumber.trim().isEmpty()) {
            return patientProfileRepository.findByOpNumber(opNumber)
                    .map(this::mapToSearchResult)
                    .map(List::of)
                    .orElse(List.of());
        }

        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        
        // Use optimized DB search
        org.springframework.data.domain.Page<User> users = userRepository.searchByNameOrEmail(query, org.springframework.data.domain.PageRequest.of(0, 20));
        
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (User u : users.getContent()) {
            if (u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_PATIENT"))) {
                patientProfileRepository.findByUserId(u.getId()).ifPresent(p -> {
                    results.add(mapToSearchResult(p, u));
                });
            }
        }
        return results;
    }
    
    private Map<String, Object> mapToSearchResult(PatientProfile p) {
        User u = p.getUserId() != null ? userRepository.findById(p.getUserId()).orElse(null) : null;
        return mapToSearchResult(p, u);
    }

    private Map<String, Object> mapToSearchResult(PatientProfile p, User u) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("patientId", p.getUserId());
        map.put("opNumber", p.getOpNumber());
        map.put("gender", p.getGender());
        map.put("dateOfBirth", p.getDateOfBirth());
        map.put("branchId", p.getBranchId());
        
        if (u != null) {
            map.put("firstName", u.getFirstName());
            map.put("lastName", u.getLastName());
            map.put("phone", u.getPhoneNumber());
            map.put("email", u.getEmail());
        }
        return map;
    }
}
