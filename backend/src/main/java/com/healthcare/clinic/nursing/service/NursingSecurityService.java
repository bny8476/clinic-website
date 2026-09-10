package com.healthcare.clinic.nursing.service;

import com.healthcare.clinic.nursing.repository.NursePatientAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("nursingSecurity")
@RequiredArgsConstructor
public class NursingSecurityService {

    private final NursePatientAssignmentRepository assignmentRepository;

    public boolean isAssigned(Authentication authentication, Long patientId) {
        if (authentication == null || !authentication.isAuthenticated()) return false;

        // Super admin always has access
        if (authentication.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_SUPER_ADMIN"))) {
            return true;
        }

        // Admin and Nurse roles always have access (no formal assignment required)
        if (authentication.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("ROLE_NURSE") ||
                a.getAuthority().equals("NURSE"))) {
            return true;
        }

        // For other roles, check formal assignment
        com.healthcare.clinic.security.UserPrincipal user =
                (com.healthcare.clinic.security.UserPrincipal) authentication.getPrincipal();
        return assignmentRepository.existsByNurseIdAndPatientIdAndStatus(user.getUserId(), patientId, "ACTIVE");
    }
}
