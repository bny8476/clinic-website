package com.healthcare.clinic.identity.service;

import com.healthcare.clinic.audit.entity.AuditRecord;
import com.healthcare.clinic.audit.service.AuditTrailService;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.department.entity.Department;
import com.healthcare.clinic.department.repository.DepartmentRepository;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.exception.ResourceNotFoundException;
import com.healthcare.clinic.identity.dto.UserCreateDto;
import com.healthcare.clinic.identity.dto.UserStatsDto;
import com.healthcare.clinic.identity.dto.UserSummaryDto;
import com.healthcare.clinic.identity.entity.Permission;
import com.healthcare.clinic.identity.entity.Role;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.RoleRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AuditTrailService auditTrailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<String> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserSummaryDto createUser(UserCreateDto createDto) {
        checkPrivilegeEscalation(createDto.getRoleNames());

        if (userRepository.existsByEmail(createDto.getEmail())) {
            throw new IllegalStateException("A user with email '" + createDto.getEmail() + "' already exists.");
        }

        if (createDto.getPhone() != null && !createDto.getPhone().isBlank()) {
            Optional<User> existingPhone = userRepository.findByPhoneNumber(createDto.getPhone());
            if (existingPhone.isPresent()) {
                throw new IllegalStateException("A user with phone number '" + createDto.getPhone() + "' already exists.");
            }
        }

        // Branch scope check for non-super-admins
        validateAdminBranchScope(createDto.getBranchId());

        User user = User.builder()
                .email(createDto.getEmail().trim().toLowerCase())
                .firstName(createDto.getFirstName().trim())
                .lastName(createDto.getLastName().trim())
                .phoneNumber(createDto.getPhone() != null ? createDto.getPhone().trim() : null)
                .passwordHash(passwordEncoder.encode(createDto.getPassword()))
                .enabled(createDto.isEnabled())
                .branchId(createDto.getBranchId())
                .departmentId(createDto.getDepartmentId())
                .build();

        if (createDto.getRoleNames() != null && !createDto.getRoleNames().isEmpty()) {
            Set<Role> roles = createDto.getRoleNames().stream()
                    .map(name -> roleRepository.findByName(name)
                            .or(() -> roleRepository.findByName("ROLE_" + name))
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + name)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        } else {
            // Default role if none specified
            roleRepository.findByName("ROLE_PATIENT").ifPresent(r -> user.setRoles(Set.of(r)));
        }

        User saved = userRepository.save(user);

        // Transactional Role-specific profile creation
        boolean isDoctor = saved.getRoles().stream()
                .anyMatch(r -> "ROLE_DOCTOR".equalsIgnoreCase(r.getName()) || "DOCTOR".equalsIgnoreCase(r.getName()));

        if (isDoctor) {
            createOrUpdateDoctorProfile(saved, createDto);
        }

        // Audit Logging
        logUserAction("USER_CREATED", saved.getId(), "Created user account for " + saved.getEmail());

        return mapToSummaryDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<UserSummaryDto> getUsersFiltered(int page, int size, String q, String role, Long branchId, Long departmentId, Boolean enabled) {
        Page<User> usersPage = userRepository.findUsersFiltered(
                (q != null && !q.isBlank()) ? q.trim() : null,
                (role != null && !role.isBlank()) ? role.trim() : null,
                branchId,
                departmentId,
                enabled,
                PageRequest.of(page, size)
        );

        return usersPage.map(this::mapToSummaryDto);
    }

    @Transactional(readOnly = true)
    public UserStatsDto getUserStats() {
        return UserStatsDto.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByEnabledTrue())
                .inactiveUsers(userRepository.countByEnabledFalse())
                .doctorsCount(userRepository.countByRolesName("DOCTOR"))
                .nursesCount(userRepository.countByRolesName("NURSE"))
                .pharmacistsCount(userRepository.countByRolesName("PHARMACIST"))
                .labStaffCount(userRepository.countByRolesName("LAB_TECH") + userRepository.countByRolesName("LAB"))
                .receptionistsCount(userRepository.countByRolesName("RECEPTIONIST"))
                .build();
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        checkIdorAccess(user);
        return mapToSummaryDto(user);
    }

    @Transactional
    public UserSummaryDto updateUser(Long id, UserSummaryDto updateDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        checkIdorAccess(user);

        if (updateDto.getRoleNames() != null) {
            checkPrivilegeEscalation(updateDto.getRoleNames());
            boolean isTargetSuperAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equals(r.getName()));
            boolean isCurrentUserSuperAdmin = isCurrentUserSuperAdmin();
            if (isTargetSuperAdmin && !isCurrentUserSuperAdmin) {
                throw new AccessDeniedException("Only a SUPER_ADMIN can modify a SUPER_ADMIN user account");
            }
        }

        if (updateDto.getBranchId() != null) {
            validateAdminBranchScope(updateDto.getBranchId());
            user.setBranchId(updateDto.getBranchId());
        }

        if (updateDto.getDepartmentId() != null) {
            user.setDepartmentId(updateDto.getDepartmentId());
        }

        if (updateDto.getFirstName() != null && !updateDto.getFirstName().isBlank()) {
            user.setFirstName(updateDto.getFirstName().trim());
        }

        if (updateDto.getLastName() != null && !updateDto.getLastName().isBlank()) {
            user.setLastName(updateDto.getLastName().trim());
        }

        if (updateDto.getPhone() != null) {
            user.setPhoneNumber(updateDto.getPhone().trim());
        }

        if (updateDto.getEmail() != null && !updateDto.getEmail().isBlank()) {
            String newEmail = updateDto.getEmail().trim().toLowerCase();
            if (!newEmail.equals(user.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    throw new IllegalStateException("A user with email '" + newEmail + "' already exists.");
                }
                user.setEmail(newEmail);
            }
        }

        if (updateDto.isEnabled() != user.isEnabled()) {
            validateStatusToggleSelfProtection(user);
            user.setEnabled(updateDto.isEnabled());
        }

        if (updateDto.getRoleNames() != null) {
            Set<Role> roles = updateDto.getRoleNames().stream()
                    .map(name -> roleRepository.findByName(name)
                            .or(() -> roleRepository.findByName("ROLE_" + name))
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + name)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        User saved = userRepository.save(user);

        // Keep doctor profile branch synced if user branch changed
        boolean isDoctor = saved.getRoles().stream()
                .anyMatch(r -> "ROLE_DOCTOR".equalsIgnoreCase(r.getName()) || "DOCTOR".equalsIgnoreCase(r.getName()));
        if (isDoctor) {
            doctorProfileRepository.findByUserId(saved.getId()).ifPresent(dp -> {
                if (saved.getBranchId() != null) dp.setBranchId(saved.getBranchId());
                doctorProfileRepository.save(dp);
            });
        }

        logUserAction("USER_UPDATED", saved.getId(), "Updated user account for " + saved.getEmail());

        return mapToSummaryDto(saved);
    }

    @Transactional
    public void toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        checkIdorAccess(user);
        validateStatusToggleSelfProtection(user);

        boolean isTargetSuperAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equals(r.getName()));
        if (isTargetSuperAdmin && !isCurrentUserSuperAdmin()) {
            throw new AccessDeniedException("Only a SUPER_ADMIN can toggle status for a SUPER_ADMIN user");
        }

        boolean newStatus = user.getEnabled() == null || !user.getEnabled();
        user.setEnabled(newStatus);
        userRepository.save(user);

        logUserAction("USER_STATUS_TOGGLED", user.getId(), "Toggled user status to " + (newStatus ? "ACTIVE" : "INACTIVE") + " for " + user.getEmail());
    }

    @Transactional
    public void resetPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        checkIdorAccess(user);

        boolean isTargetSuperAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equals(r.getName()));
        if (isTargetSuperAdmin && !isCurrentUserSuperAdmin()) {
            throw new AccessDeniedException("Only a SUPER_ADMIN can reset password for a SUPER_ADMIN user");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        logUserAction("PASSWORD_RESET_COMPLETED", user.getId(), "Reset password for user " + user.getEmail());
    }

    private void validateStatusToggleSelfProtection(User targetUser) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            if (auth.getName().equalsIgnoreCase(targetUser.getEmail())) {
                throw new IllegalStateException("CANNOT_DEACTIVATE_SELF: You cannot deactivate your own user account.");
            }
        }

        // Check last active super admin protection
        boolean isSuperAdmin = targetUser.getRoles().stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equals(r.getName()));
        if (isSuperAdmin && targetUser.isEnabled()) {
            long activeSuperAdmins = userRepository.countByRolesName("SUPER_ADMIN");
            if (activeSuperAdmins <= 1) {
                throw new IllegalStateException("CANNOT_REMOVE_LAST_ADMIN: Cannot deactivate the last active Super Admin in the system.");
            }
        }
    }

    private void validateAdminBranchScope(Long targetBranchId) {
        if (targetBranchId == null || isCurrentUserSuperAdmin()) return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return;

        String currentEmail = auth.getName();
        userRepository.findByEmail(currentEmail).ifPresent(currentUser -> {
            if (currentUser.getBranchId() != null && !currentUser.getBranchId().equals(targetBranchId)) {
                throw new AccessDeniedException("BRANCH_ACCESS_DENIED: You can only assign users to your authorized branch (Branch ID: " + currentUser.getBranchId() + ").");
            }
        });
    }

    private void createOrUpdateDoctorProfile(User user, UserCreateDto createDto) {
        DoctorProfile dp = doctorProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> DoctorProfile.builder()
                        .userId(user.getId())
                        .build());

        dp.setBranchId(user.getBranchId() != null ? user.getBranchId() : 1L);
        dp.setSpecialty(createDto.getSpecialty() != null && !createDto.getSpecialty().isBlank() ? createDto.getSpecialty() : "General Medicine");
        dp.setQualifications(createDto.getQualifications() != null && !createDto.getQualifications().isBlank() ? createDto.getQualifications() : "MBBS");
        dp.setConsultationFee(createDto.getConsultationFee() != null ? createDto.getConsultationFee() : BigDecimal.valueOf(500));
        dp.setRegistrationNumber(createDto.getRegistrationNumber() != null && !createDto.getRegistrationNumber().isBlank() ? createDto.getRegistrationNumber() : "REG-" + user.getId());
        dp.setExperienceYears(createDto.getExperienceYears() != null ? createDto.getExperienceYears() : 5);
        dp.setIsActive(user.getEnabled() != null ? user.getEnabled() : true);

        doctorProfileRepository.save(dp);
    }

    private void checkPrivilegeEscalation(List<String> targetRoles) {
        if (targetRoles == null) return;
        boolean wantsSuperAdmin = targetRoles.stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equalsIgnoreCase(r) || "SUPER_ADMIN".equalsIgnoreCase(r));
        if (wantsSuperAdmin && !isCurrentUserSuperAdmin()) {
            throw new AccessDeniedException("CANNOT_CREATE_SUPER_ADMIN: Only a SUPER_ADMIN can assign the SUPER_ADMIN role");
        }
    }

    private void checkIdorAccess(User targetUser) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new AccessDeniedException("Not authenticated");

        String currentEmail = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isAdmin && !currentEmail.equalsIgnoreCase(targetUser.getEmail())) {
            throw new AccessDeniedException("You do not have permission to access this user record");
        }
    }

    private boolean isCurrentUserSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    private void logUserAction(String action, Long userId, String details) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Long actorId = null;
            if (auth != null && auth.getName() != null) {
                actorId = userRepository.findByEmail(auth.getName()).map(User::getId).orElse(null);
            }

            AuditRecord record = AuditRecord.builder()
                    .actorId(actorId)
                    .actionName(action)
                    .moduleName("IDENTITY")
                    .resourceType("USER")
                    .resourceId(userId != null ? userId.toString() : "0")
                    .outcome("SUCCESS")
                    .afterValues(details)
                    .sensitivityLevel("HIGH")
                    .build();

            auditTrailService.logAuditAsync(record);
        } catch (Exception e) {
            log.warn("Failed to record audit event for action {}: {}", action, e.getMessage());
        }
    }

    private UserSummaryDto mapToSummaryDto(User user) {
        String branchName = null;
        if (user.getBranchId() != null) {
            branchName = branchRepository.findById(user.getBranchId())
                    .map(Branch::getName)
                    .orElse("Branch #" + user.getBranchId());
        }

        String departmentName = null;
        if (user.getDepartmentId() != null) {
            departmentName = departmentRepository.findById(user.getDepartmentId())
                    .map(Department::getName)
                    .orElse("Department #" + user.getDepartmentId());
        }

        List<String> roleNames = user.getRoles() != null
                ? user.getRoles().stream().map(Role::getName).collect(Collectors.toList())
                : Collections.emptyList();

        List<String> permissions = user.getRoles() != null
                ? user.getRoles().stream()
                        .filter(r -> r.getPermissions() != null)
                        .flatMap(r -> r.getPermissions().stream())
                        .map(Permission::getName)
                        .distinct()
                        .collect(Collectors.toList())
                : Collections.emptyList();

        return UserSummaryDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhoneNumber())
                .enabled(user.getEnabled() != null ? user.getEnabled() : true)
                .roleNames(roleNames)
                .branchId(user.getBranchId())
                .branchName(branchName)
                .departmentId(user.getDepartmentId())
                .departmentName(departmentName)
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .permissions(permissions)
                .build();
    }
}
