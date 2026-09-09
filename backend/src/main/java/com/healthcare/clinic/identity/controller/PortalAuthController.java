package com.healthcare.clinic.identity.controller;

import com.healthcare.clinic.identity.entity.LoginHistory;
import com.healthcare.clinic.identity.entity.Role;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.LoginHistoryRepository;
import com.healthcare.clinic.identity.repository.RoleRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.identity.service.OtpService;
import com.healthcare.clinic.identity.service.RefreshTokenService;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.identity.service.PatientRegistrationService;
import com.healthcare.clinic.security.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class PortalAuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;
    private final LoginHistoryRepository loginHistoryRepository;
    private final PatientRegistrationService patientRegistrationService;
    private final RefreshTokenService refreshTokenService;
    private final OtpService otpService;
    private final UserDetailsService userDetailsService;
    private final PatientProfileRepository patientProfileRepository;

    @PostMapping("/login")
    public ResponseEntity<?> unifiedLogin(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        String identifier = loginRequest.getEmail() != null ? loginRequest.getEmail().trim() : "";
        User user = userRepository.findByIdentifier(identifier).orElse(null);

        if (user != null && user.getLockedUntil() != null && user.getLockedUntil().isAfter(ZonedDateTime.now())) {
            return ResponseEntity.status(HttpStatus.LOCKED).body("Account is locked. Try again later.");
        }

        String authUsername = user != null ? user.getEmail() : identifier;

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authUsername, loginRequest.getPassword()));
        } catch (BadCredentialsException e) {
            if (user != null) {
                user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
                if (user.getFailedLoginAttempts() >= 5) {
                    user.setLockedUntil(ZonedDateTime.now().plusMinutes(15));
                }
                userRepository.save(user);
                logLoginHistory(user, request, false);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        User authenticatedUser = (User) authentication.getPrincipal();

        // Reset failed attempts
        authenticatedUser.setFailedLoginAttempts(0);
        authenticatedUser.setLockedUntil(null);
        userRepository.save(authenticatedUser);

        if (authenticatedUser.isMfaEnabled()) {
            otpService.generateAndSendOtp(authenticatedUser);
            logLoginHistory(authenticatedUser, request, true);
            return ResponseEntity.ok(new MfaRequiredResponse(authenticatedUser.getEmail(), true));
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        String refreshToken = refreshTokenService.createRefreshToken(authenticatedUser.getId()).getToken();

        logLoginHistory(authenticatedUser, request, true);

        org.springframework.http.ResponseCookie refreshCookie = org.springframework.http.ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/api/auth")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("None")
                .build();

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(buildJwtResponse(jwt, refreshToken, authenticatedUser));
    }

    @PostMapping("/{portal}/login")
    public ResponseEntity<?> authenticateUser(@PathVariable String portal, @Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        return unifiedLogin(loginRequest, request);
    }

    @PostMapping("/login/mfa")
    public ResponseEntity<?> verifyMfaLoginUnified(@Valid @RequestBody MfaLoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid request");
        }

        boolean isValid = otpService.verifyOtp(request.getOtp(), user);
        if (!isValid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired OTP");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        String jwt = jwtUtils.generateJwtToken(authentication);
        String refreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();

        org.springframework.http.ResponseCookie refreshCookie = org.springframework.http.ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/api/auth")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("None")
                .build();

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(buildJwtResponse(jwt, refreshToken, user));
    }

    @PostMapping("/{portal}/login/mfa")
    public ResponseEntity<?> verifyMfaLogin(@PathVariable String portal, @Valid @RequestBody MfaLoginRequest request, HttpServletRequest httpRequest) {
        return verifyMfaLoginUnified(request, httpRequest);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }
        User user = null;
        if (auth.getPrincipal() instanceof com.healthcare.clinic.security.UserPrincipal) {
            com.healthcare.clinic.security.UserPrincipal up = (com.healthcare.clinic.security.UserPrincipal) auth.getPrincipal();
            if (up.getUserId() != null) {
                user = userRepository.findById(up.getUserId()).orElse(null);
            }
            if (user == null && up.getUsername() != null) {
                user = userRepository.findByEmail(up.getUsername()).orElse(null);
            }
        } else if (auth.getPrincipal() instanceof User) {
            user = (User) auth.getPrincipal();
        } else if (auth.getPrincipal() instanceof UserDetails) {
            UserDetails ud = (UserDetails) auth.getPrincipal();
            user = userRepository.findByEmail(ud.getUsername()).orElse(null);
        }
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
        }
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        Set<String> permissions = new HashSet<>();
        user.getRoles().forEach(r -> {
            if (r.getPermissions() != null) {
                r.getPermissions().forEach(p -> permissions.add(p.getName()));
            }
        });
        UserDto userDto = new UserDto(user.getId(), user.getFirstName() + " " + user.getLastName(), user.getEmail(), user.getFirstName(), user.getLastName());
        return ResponseEntity.ok(new UserProfileResponse(userDto, roles, permissions));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        try {
            String firstName = signUpRequest.getFirstName() != null ? signUpRequest.getFirstName().trim() : "";
            String lastName = signUpRequest.getLastName() != null && !signUpRequest.getLastName().isBlank()
                    ? signUpRequest.getLastName().trim()
                    : firstName;

            patientRegistrationService.registerPatient(
                    signUpRequest.getEmail() != null ? signUpRequest.getEmail().trim().toLowerCase() : "",
                    signUpRequest.getPassword(),
                    firstName,
                    lastName,
                    signUpRequest.getPhoneNumber()
            );
            return ResponseEntity.ok("User registered successfully!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage() != null ? e.getMessage() : "Registration failed.");
        }
    }

    private JwtResponse buildJwtResponse(String jwt, String refreshToken, User user) {
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        Set<String> permissions = new HashSet<>();
        user.getRoles().forEach(r -> {
            if (r.getPermissions() != null) {
                r.getPermissions().forEach(p -> permissions.add(p.getName()));
            }
        });
        UserDto userDto = new UserDto(user.getId(), user.getFirstName() + " " + user.getLastName(), user.getEmail(), user.getFirstName(), user.getLastName());
        return new JwtResponse(jwt, refreshToken, 900L, userDto, roles, permissions);
    }

    private void logLoginHistory(User user, HttpServletRequest request, boolean success) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null) ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        
        LoginHistory history = new LoginHistory();
        history.setUser(user);
        history.setIpAddress(ip);
        history.setUserAgent(userAgent);
        history.setSuccess(success);
        history.setCreatedAt(ZonedDateTime.now());
        loginHistoryRepository.save(history);
    }
}

@Data
class LoginRequest {
    @jakarta.validation.constraints.NotBlank
    private String email;
    @jakarta.validation.constraints.NotBlank
    private String password;
}

@Data
class MfaLoginRequest {
    @jakarta.validation.constraints.NotBlank
    @jakarta.validation.constraints.Email
    private String email;
    @jakarta.validation.constraints.NotBlank
    private String otp;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class SignupRequest {
    @jakarta.validation.constraints.NotBlank(message = "Email is required")
    @jakarta.validation.constraints.Email(message = "Invalid email format")
    private String email;

    @jakarta.validation.constraints.NotBlank(message = "Password is required")
    @jakarta.validation.constraints.Size(min = 8, message = "Password must be at least 8 characters long")
    @jakarta.validation.constraints.Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
        message = "Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
    )
    private String password;

    @jakarta.validation.constraints.NotBlank(message = "First name is required")
    private String firstName;

    private String lastName;

    private String phoneNumber;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
}

@Data
@AllArgsConstructor
@NoArgsConstructor
class UserDto {
    private Long id;
    private String name;
    private String email;
    private String firstName;
    private String lastName;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
class UserProfileResponse {
    private UserDto user;
    private Set<String> roles;
    private Set<String> permissions;
}

@Data
class JwtResponse {
    private String token;
    private String accessToken;
    private String refreshToken;
    private String type = "Bearer";
    private Long expiresIn;
    private UserDto user;
    private Set<String> roles;
    private Set<String> permissions;

    public JwtResponse(String accessToken, String refreshToken, Long expiresIn, UserDto user, Set<String> roles, Set<String> permissions) {
        this.token = accessToken;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.user = user;
        this.roles = roles;
        this.permissions = permissions;
    }
}

@Data
class MfaRequiredResponse {
    private String email;
    private boolean mfaRequired;
    
    public MfaRequiredResponse(String email, boolean mfaRequired) {
        this.email = email;
        this.mfaRequired = mfaRequired;
    }
}
