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

    @PostMapping("/{portal}/login")
    public ResponseEntity<?> authenticateUser(@PathVariable String portal, @Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        User user = userRepository.findByEmail(loginRequest.getEmail()).orElse(null);

        if (user != null && user.getLockedUntil() != null && user.getLockedUntil().isAfter(ZonedDateTime.now())) {
            return ResponseEntity.status(HttpStatus.LOCKED).body("Account is locked. Try again later.");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));
        } catch (BadCredentialsException e) {
            if (user != null) {
                user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
                if (user.getFailedLoginAttempts() >= 5) {
                    user.setLockedUntil(ZonedDateTime.now().plusMinutes(15));
                }
                userRepository.save(user);
                logLoginHistory(user, request, false);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }

        User authenticatedUser = (User) authentication.getPrincipal();
        
        // Validate portal access
        boolean hasPortalAccess = authenticatedUser.getRoles().stream()
                .anyMatch(r -> (r.getLoginPortal() != null && portal.equals(r.getLoginPortal()))
                            || isPortalMatchingRole(portal, r.getName()));
                
        if (!hasPortalAccess) {
            logLoginHistory(authenticatedUser, request, false);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied for this portal.");
        }

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
                .body(new JwtResponse(jwt));
    }

    @PostMapping("/{portal}/login/mfa")
    public ResponseEntity<?> verifyMfaLogin(@PathVariable String portal, @Valid @RequestBody MfaLoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid request");
        }
        
        boolean hasPortalAccess = user.getRoles().stream()
                .anyMatch(r -> portal.equals(r.getLoginPortal()));
                
        if (!hasPortalAccess) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied for this portal.");
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
                .body(new JwtResponse(jwt));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        try {
            patientRegistrationService.registerPatient(
                    signUpRequest.getEmail(),
                    signUpRequest.getPassword(),
                    signUpRequest.getFirstName(),
                    signUpRequest.getLastName()
            );
            return ResponseEntity.ok("User registered successfully!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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

    private boolean isPortalMatchingRole(String portal, String roleName) {
        if (roleName == null || portal == null) return false;
        String normalizedRole = roleName.toUpperCase().replace("ROLE_", "");
        String normalizedPortal = portal.toUpperCase().replace("-", "_");

        if (normalizedRole.equals(normalizedPortal) || "ADMIN".equals(normalizedRole) || "SUPER_ADMIN".equals(normalizedRole)) {
            return true;
        }

        if ("PHARMACY".equals(normalizedPortal)) {
            return normalizedRole.contains("PHARMAC") || normalizedRole.contains("STOREKEEPER");
        }

        if ("LAB".equals(normalizedPortal) || "LABORATORY".equals(normalizedPortal)) {
            return normalizedRole.contains("LAB") || "PATHOLOGIST".equals(normalizedRole);
        }

        if ("RADIOLOGY".equals(normalizedPortal) || "RADIOLOGIST".equals(normalizedPortal)) {
            return normalizedRole.contains("RADIO");
        }

        if ("NURSE".equals(normalizedPortal)) {
            return normalizedRole.contains("NURSE");
        }

        if ("DOCTOR".equals(normalizedPortal)) {
            return normalizedRole.contains("DOCTOR") || normalizedRole.contains("PHYSICIAN");
        }

        return false;
    }
}

@Data
class LoginRequest {
    @jakarta.validation.constraints.NotBlank
    @jakarta.validation.constraints.Email
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
class SignupRequest {
    @jakarta.validation.constraints.NotBlank
    @jakarta.validation.constraints.Email
    private String email;
    @jakarta.validation.constraints.NotBlank
    @jakarta.validation.constraints.Size(min = 8)
    @jakarta.validation.constraints.Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$", message = "must contain at least one uppercase, one lowercase, one number and one special character")
    private String password;
    @jakarta.validation.constraints.NotBlank
    private String firstName;
    @jakarta.validation.constraints.NotBlank
    private String lastName;
}

@Data
class JwtResponse {
    private String token;
    private String type = "Bearer";

    public JwtResponse(String accessToken) {
        this.token = accessToken;
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
