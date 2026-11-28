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
        String trimmed = query.trim();
        List<Map<String, Object>> results = new ArrayList<>();
        Set<Long> seenProfileIds = new HashSet<>();

        // Direct OP number match via query
        patientProfileRepository.findByOpNumber(trimmed).ifPresent(p -> {
            if (seenProfileIds.add(p.getId())) {
                results.add(mapToSearchResult(p));
            }
        });

        // Direct numeric patientProfileId or userId match
        if (trimmed.matches("\\d+")) {
            Long numId = Long.parseLong(trimmed);
            patientProfileRepository.findById(numId).ifPresent(p -> {
                if (seenProfileIds.add(p.getId())) {
                    results.add(mapToSearchResult(p));
                }
            });
            patientProfileRepository.findByUserId(numId).ifPresent(p -> {
                if (seenProfileIds.add(p.getId())) {
                    results.add(mapToSearchResult(p));
                }
            });
        }

        // Optimized DB search by name, email, or phone
        org.springframework.data.domain.Page<User> users = userRepository.searchByNameOrEmail(trimmed, org.springframework.data.domain.PageRequest.of(0, 20));
        
        for (User u : users.getContent()) {
            boolean hasPatientRole = u.getRoles() == null || u.getRoles().isEmpty()
                    || u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_PATIENT") || r.getName().equals("PATIENT"));
            if (hasPatientRole) {
                patientProfileRepository.findByUserId(u.getId()).ifPresent(p -> {
                    if (seenProfileIds.add(p.getId())) {
                        results.add(mapToSearchResult(p, u));
                    }
                });
            }
        }
        return results;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPatientProfile(Long patientId) {
        PatientProfile p = patientProfileRepository.findById(patientId)
                .or(() -> patientProfileRepository.findByUserId(patientId))
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + patientId));
        return mapToSearchResult(p);
    }

    @Transactional
    public Map<String, Object> updatePatientProfile(Long patientId, Map<String, Object> request) {
        PatientProfile p = patientProfileRepository.findById(patientId)
                .or(() -> patientProfileRepository.findByUserId(patientId))
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + patientId));

        User u = p.getUserId() != null ? userRepository.findById(p.getUserId()).orElse(null) : null;
        if (u != null) {
            if (request.containsKey("firstName") && request.get("firstName") != null) {
                u.setFirstName(request.get("firstName").toString());
            }
            if (request.containsKey("lastName") && request.get("lastName") != null) {
                u.setLastName(request.get("lastName").toString());
            }
            if (request.containsKey("phone") && request.get("phone") != null) {
                u.setPhoneNumber(request.get("phone").toString());
            }
            userRepository.save(u);
        }

        // Limited Reception-only fields (no clinical diagnosis/notes/prescriptions)
        if (request.containsKey("address")) p.setAddress((String) request.get("address"));
        if (request.containsKey("gender")) p.setGender((String) request.get("gender"));
        if (request.containsKey("emergencyContact")) p.setEmergencyContactPhone((String) request.get("emergencyContact"));
        if (request.containsKey("emergencyContactName")) p.setEmergencyContactName((String) request.get("emergencyContactName"));
        if (request.containsKey("dateOfBirth") && request.get("dateOfBirth") != null) {
            try {
                p.setDateOfBirth(LocalDate.parse(request.get("dateOfBirth").toString()));
            } catch (Exception ignored) {}
        }

        PatientProfile saved = patientProfileRepository.save(p);
        return mapToSearchResult(saved, u);
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
        map.put("address", p.getAddress());
        map.put("bloodGroup", p.getBloodGroup());
        map.put("emergencyContact", p.getEmergencyContactPhone());
        map.put("emergencyContactName", p.getEmergencyContactName());
        
        if (u != null) {
            map.put("firstName", u.getFirstName());
            map.put("lastName", u.getLastName());
            String fullName = ((u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "")).trim();
            map.put("name", fullName);
            map.put("fullName", fullName);
            map.put("phone", u.getPhoneNumber());
            map.put("email", u.getEmail());
        }
        return map;
    }
}
