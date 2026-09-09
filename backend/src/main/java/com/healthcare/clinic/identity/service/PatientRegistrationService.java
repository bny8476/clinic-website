package com.healthcare.clinic.identity.service;

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

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PatientRegistrationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PatientProfileRepository patientProfileRepository;

    @Transactional
    public User registerPatient(String email, String password, String firstName, String lastName) {
        return registerPatient(email, password, firstName, lastName, null);
    }

    @Transactional
    public User registerPatient(String email, String password, String firstName, String lastName, String phoneNumber) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Error: Email cannot be empty!");
        }
        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Error: Email is already in use!");
        }

        String safeFirstName = (firstName != null && !firstName.isBlank()) ? firstName.trim() : "User";
        String safeLastName = (lastName != null && !lastName.isBlank()) ? lastName.trim() : safeFirstName;

        User user = User.builder()
                .email(normalizedEmail)
                .firstName(safeFirstName)
                .lastName(safeLastName)
                .phoneNumber(phoneNumber != null && !phoneNumber.isBlank() ? phoneNumber.trim() : null)
                .passwordHash(passwordEncoder.encode(password))
                .build();

        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName("ROLE_PATIENT")
                .orElseGet(() -> roleRepository.findByName("PATIENT")
                        .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_PATIENT").description("Patient Role").build())));
        roles.add(userRole);

        user.setRoles(roles);
        User savedUser = userRepository.save(user);

        PatientProfile profile = PatientProfile.builder()
                .userId(savedUser.getId())
                .gender("Not Specified")
                .dateOfBirth(java.time.LocalDate.of(2000, 1, 1))
                .emergencyContactName(safeFirstName + " " + safeLastName)
                .emergencyContactPhone(phoneNumber != null && !phoneNumber.isBlank() ? phoneNumber : "+10000000000")
                .branchId(1L)
                .build();
        patientProfileRepository.save(profile);

        return savedUser;
    }
}
