package com.healthcare.clinic.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Security utility bean. Registered as a Spring component so it can be
 * referenced in @PreAuthorize SpEL expressions via "@securityUtils.*".
 */
@Component("securityUtils")
public class SecurityUtils {

    // ─── Static helpers ────────────────────────────────────────────────────────

    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) authentication.getPrincipal()).getUserId();
        }
        return null;
    }

    public static boolean isPatient() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"));
    }

    public static void assertOwnerOrAdmin(Long resourceUserId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new AccessDeniedException("You do not have permission to access this resource");
        }
        boolean isStaffOrAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().startsWith("ROLE_ADMIN")
                        || a.getAuthority().startsWith("ROLE_SUPER_ADMIN")
                        || a.getAuthority().equals("ROLE_DOCTOR")
                        || a.getAuthority().equals("ROLE_RECEPTION")
                        || a.getAuthority().equals("ROLE_NURSE")
                        || a.getAuthority().equals("ROLE_PHARMACIST")
                        || a.getAuthority().equals("ROLE_LAB")
                        || a.getAuthority().equals("ROLE_RADIOLOGIST")
                        || a.getAuthority().equals("ROLE_FINANCE")
                        || a.getAuthority().equals("ROLE_ACCOUNTANT"));
        if (isStaffOrAdmin) {
            return;
        }
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null || !currentUserId.equals(resourceUserId)) {
            throw new AccessDeniedException("You do not have permission to access this resource");
        }
    }

    public static void assertBranchAdmin(Long branchId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal)) {
            throw new AccessDeniedException("You do not have permission to access this resource");
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        boolean isBranchAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_BRANCH_ADMIN"));

        if (!isBranchAdmin || principal.getBranchId() == null || !principal.getBranchId().equals(branchId)) {
            throw new AccessDeniedException("You do not have permission to manage this branch");
        }
    }

    // ─── SpEL-accessible instance methods (used in @PreAuthorize) ─────────────

    /**
     * Returns true if the currently authenticated user's userId equals the
     * supplied userId. Used in @PreAuthorize SpEL as
     * {@code @securityUtils.isSameUser(#patientId)}.
     */
    public boolean isSameUser(Long userId) {
        Long currentUserId = getCurrentUserId();
        return currentUserId != null && currentUserId.equals(userId);
    }
}
