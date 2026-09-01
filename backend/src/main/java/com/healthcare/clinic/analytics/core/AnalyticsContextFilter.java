package com.healthcare.clinic.analytics.core;

import com.healthcare.clinic.security.SecurityUtils;
import com.healthcare.clinic.security.UserPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsContextFilter {

    /**
     * Validates that the current user has permission to view analytics for the requested branch.
     * If the requested branch is null, it enforces the user's branch if they are restricted to one.
     * 
     * @param requestedBranchId The branch ID requested in the API call (nullable for aggregate)
     * @return The safe branch ID to query, or null if the user can query all branches globally.
     */
    public Long getSafeBranchId(Long requestedBranchId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal)) {
            throw new AccessDeniedException("Unauthorized");
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        boolean isGlobalAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
                               a.getAuthority().equals("ROLE_SYSTEM_ADMIN") ||
                               a.getAuthority().equals("ROLE_EXECUTIVE"));

        if (isGlobalAdmin) {
            return requestedBranchId; // Admins can view any requested branch, or null for all branches
        }

        // For Branch Admins or other staff restricted to a branch
        Long userBranchId = principal.getBranchId();
        if (userBranchId == null) {
            // Unlikely to happen for non-admins in a multi-tenant setup, but fallback safety
            throw new AccessDeniedException("User has no branch assignment");
        }

        if (requestedBranchId != null && !requestedBranchId.equals(userBranchId)) {
            throw new AccessDeniedException("You do not have permission to view analytics for this branch");
        }

        return userBranchId;
    }

    /**
     * Validates that the current user has permission to view analytics for the requested doctor.
     */
    public Long getSafeDoctorId(Long requestedDoctorId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isGlobalAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
                               a.getAuthority().equals("ROLE_BRANCH_ADMIN"));

        if (isGlobalAdmin) {
            return requestedDoctorId;
        }

        // If a regular doctor is viewing performance, they can only view their own
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (requestedDoctorId != null && !requestedDoctorId.equals(currentUserId)) {
            throw new AccessDeniedException("You do not have permission to view analytics for this doctor");
        }

        return currentUserId;
    }
}
