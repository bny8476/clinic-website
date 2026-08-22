package com.healthcare.clinic.inventory.service;

import com.healthcare.clinic.inventory.dto.CreateUserRequest;
import com.healthcare.clinic.inventory.dto.UserRequestDto;
import com.healthcare.clinic.inventory.dto.UserResponseDTO;
import com.healthcare.clinic.pharmacy.entity.PharmacyRole;
import com.healthcare.clinic.pharmacy.entity.PharmacyUser;
import com.healthcare.clinic.pharmacy.repository.PharmacyRoleRepository;
import com.healthcare.clinic.pharmacy.repository.PharmacyUserRepository;
import com.healthcare.clinic.inventory.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import com.healthcare.clinic.exception.ResourceNotFoundException;

/**
 * Service layer for all PharmacyUser management operations.
 * Extracted from AuthController to enforce the single-responsibility principle.
 */
@Service("pharmacyUserService")
@Transactional
public class UserService {

    private final PharmacyUserRepository userRepository;
    private final PharmacyRoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserService(PharmacyUserRepository userRepository,
                       PharmacyRoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       UserMapper userMapper) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    /** Returns all non-deleted users mapped to response DTOs. */
    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    /** Creates a new user and returns the saved DTO. */
    public UserResponseDTO createUser(CreateUserRequest dto) {
        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists: " + dto.getUsername());
        }

        PharmacyUser user = userMapper.toEntity(dto);
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        user.setMustChangePassword(true);

        if (dto.getRoles() != null && !dto.getRoles().isEmpty()) {
            user.setRoles(resolveRoles(dto.getRoles()));
        }

        return userMapper.toResponseDto(userRepository.save(user));
    }

    /** Updates a user's profile (name, email, phone, branch, shift). */
    @Transactional
    public UserResponseDTO updateProfile(Long id, String name, String email,
                                         String phone, String branch, String shift) {
        PharmacyUser user = findUserById(id);
        
        if (name   != null) user.setName(name);
        if (email  != null) user.setEmail(email);
        if (phone  != null) user.setPhone(phone);
        if (branch != null) user.setBranch(branch);
        if (shift  != null) user.setShift(shift);
        return userMapper.toResponseDto(userRepository.save(user));
    }

    /** Full admin update: roles, password, status etc. */
    public UserResponseDTO updateUser(Long id, UserRequestDto dto) {
        PharmacyUser user = findUserById(id);
        
        CreateUserRequest mappedRequest = new CreateUserRequest();
        mappedRequest.setName(dto.getName());
        mappedRequest.setEmail(dto.getEmail());
        mappedRequest.setPhone(dto.getPhone());
        mappedRequest.setBranch(dto.getBranch());
        mappedRequest.setShift(dto.getShift());
        
        userMapper.updateEntityFromRequest(mappedRequest, user);
        user.setStatus(dto.getStatus());

        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }

        if (dto.getRoles() != null && !dto.getRoles().isEmpty()) {
            Set<PharmacyRole> roles = resolveRoles(
                dto.getRoles().stream()
                   .filter(r -> r != null && !r.isBlank())
                   .collect(Collectors.toList())
            );
            if (!roles.isEmpty()) {
                user.setRoles(roles);
            }
        }

        return userMapper.toResponseDto(userRepository.save(user));
    }

    /** Toggles between ACTIVE and SUSPENDED. */
    public UserResponseDTO toggleStatus(Long id) {
        PharmacyUser user = findUserById(id);
        String newStatus = "ACTIVE".equals(user.getStatus()) ? "SUSPENDED" : "ACTIVE";
        user.setStatus(newStatus);
        return userMapper.toResponseDto(userRepository.save(user));
    }

    /**
     * Resets password to a system-generated temporary value and flags
     * {@code mustChangePassword = true}.
     *
     * @return Map with keys {@code username}, {@code temporaryPassword}, {@code name}.
     */
    public java.util.Map<String, String> resetPassword(Long id) {
        PharmacyUser user = findUserById(id);

        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        StringBuilder temp = new StringBuilder();
        java.security.SecureRandom random = new java.security.SecureRandom();
        for (int i = 0; i < 8; i++) {
            temp.append(chars.charAt(random.nextInt(chars.length())));
        }
        String rawPassword = "Ph@" + temp;

        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setMustChangePassword(true);
        userRepository.save(user);

        java.util.Map<String, String> result = new java.util.HashMap<>();
        result.put("username",          user.getUsername());
        result.put("temporaryPassword", rawPassword);
        result.put("name",              user.getName());
        return result;
    }

    /** Soft-deletes a user. */
    public void deleteUser(Long id) {
        PharmacyUser user = findUserById(id);
        user.setDeleted(true);
        userRepository.save(user);
    }

    /** Changes user's own password and clears the {@code mustChangePassword} flag. */
    public void changePassword(String username, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        PharmacyUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("PharmacyUser not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    /** Updates the last-login timestamp asynchronously. */
    public void recordLastLogin(Long id) {
        userRepository.findById(id).ifPresent(user -> {
            userRepository.updateLastLogin(id, LocalDateTime.now());
        });
    }

    /** Updates the last-logout timestamp. */
    public void recordLastLogout(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setLastLogout(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Helper to find an active user by ID, throws exception if not found or deleted. */
    public PharmacyUser findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PharmacyUser not found: " + id));
    }

    private Set<PharmacyRole> resolveRoles(List<String> roleNames) {
        return roleNames.stream()
                .map(name -> roleRepository.findByName(name)
                        .orElseThrow(() -> new RuntimeException(
                                "PharmacyRole not found: " + name + ". Valid roles: " +
                                roleRepository.findAll().stream()
                                        .map(PharmacyRole::getName)
                                        .collect(Collectors.joining(", "))
                        )))
                .collect(Collectors.toSet());
    }
}
