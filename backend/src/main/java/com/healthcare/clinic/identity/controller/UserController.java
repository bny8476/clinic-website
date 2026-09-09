package com.healthcare.clinic.identity.controller;

import com.healthcare.clinic.identity.dto.PasswordResetDto;
import com.healthcare.clinic.identity.dto.UserCreateDto;
import com.healthcare.clinic.identity.dto.UserStatsDto;
import com.healthcare.clinic.identity.dto.UserSummaryDto;
import com.healthcare.clinic.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/roles")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<String>> getAllRoles() {
        return ResponseEntity.ok(userService.getAllRoles());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserStatsDto> getUserStats() {
        return ResponseEntity.ok(userService.getUserStats());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserSummaryDto> createUser(@Valid @RequestBody UserCreateDto createDto) {
        return ResponseEntity.ok(userService.createUser(createDto));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Page<UserSummaryDto>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Boolean status,
            @RequestParam(required = false) Boolean enabled) {
        
        String searchQuery = (search != null && !search.isBlank()) ? search : q;
        Boolean isEnabled = status != null ? status : enabled;

        return ResponseEntity.ok(userService.getUsersFiltered(page, size, searchQuery, role, branchId, departmentId, isEnabled));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_HR_MANAGER')")
    public ResponseEntity<Page<UserSummaryDto>> searchUsers(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String query = (search != null && !search.isBlank()) ? search : q;
        return ResponseEntity.ok(userService.getUsersFiltered(page, size, query, role, branchId, departmentId, null));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserSummaryDto> updateUser(
            @PathVariable Long id, 
            @Valid @RequestBody UserSummaryDto updateDto) {
        return ResponseEntity.ok(userService.updateUser(id, updateDto));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> toggleUserStatus(@PathVariable Long id) {
        userService.toggleUserStatus(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody PasswordResetDto passwordResetDto) {
        userService.resetPassword(id, passwordResetDto.getNewPassword());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<UserSummaryDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
}
