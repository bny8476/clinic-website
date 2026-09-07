package com.healthcare.clinic.identity.controller;

import com.healthcare.clinic.identity.entity.RefreshToken;
import com.healthcare.clinic.identity.service.RefreshTokenService;
import com.healthcare.clinic.security.JwtUtils;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class RefreshTokenController {

    private final RefreshTokenService refreshTokenService;
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshtoken(
            @CookieValue(name = "refresh_token", required = false) String cookieRefreshToken,
            @RequestBody(required = false) TokenRefreshRequest bodyRequest) {

        String requestRefreshToken = cookieRefreshToken;
        if ((requestRefreshToken == null || requestRefreshToken.isEmpty()) && bodyRequest != null) {
            requestRefreshToken = bodyRequest.getRefreshToken();
        }

        if (requestRefreshToken == null || requestRefreshToken.isBlank()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body("Refresh token is missing");
        }

        try {
            return refreshTokenService.findByToken(requestRefreshToken)
                    .map(refreshTokenService::verifyExpiration)
                    .map(RefreshToken::getUser)
                    .map(user -> {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        
                        String token = jwtUtils.generateJwtToken(auth);
                        
                        // Rotate refresh token
                        refreshTokenService.deleteByUserId(user.getId());
                        String newRefreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();
                        
                        org.springframework.http.ResponseCookie refreshCookie = org.springframework.http.ResponseCookie.from("refresh_token", newRefreshToken)
                                .httpOnly(true)
                                .secure(true)
                                .path("/api/auth")
                                .maxAge(7 * 24 * 60 * 60)
                                .sameSite("None")
                                .build();

                        java.util.Set<String> roles = user.getRoles().stream()
                                .map(com.healthcare.clinic.identity.entity.Role::getName)
                                .collect(java.util.stream.Collectors.toSet());
                        java.util.Set<String> permissions = new java.util.HashSet<>();
                        user.getRoles().forEach(r -> {
                            if (r.getPermissions() != null) {
                                r.getPermissions().forEach(p -> permissions.add(p.getName()));
                            }
                        });
                        UserDto userDto = new UserDto(user.getId(), user.getFirstName() + " " + user.getLastName(), user.getEmail(), user.getFirstName(), user.getLastName());

                        return ResponseEntity.ok()
                                .header(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString())
                                .body(new TokenRefreshResponse(token, newRefreshToken, 900L, userDto, roles, permissions));
                    })
                    .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(
            @CookieValue(name = "refresh_token", required = false) String cookieRefreshToken,
            @RequestBody(required = false) TokenRefreshRequest bodyRequest) {

        String requestRefreshToken = cookieRefreshToken;
        if ((requestRefreshToken == null || requestRefreshToken.isEmpty()) && bodyRequest != null) {
            requestRefreshToken = bodyRequest.getRefreshToken();
        }

        if (requestRefreshToken != null && !requestRefreshToken.isEmpty()) {
            refreshTokenService.findByToken(requestRefreshToken).ifPresent(token -> {
                refreshTokenService.deleteByUserId(token.getUser().getId());
            });
        }
        
        org.springframework.http.ResponseCookie clearCookie = org.springframework.http.ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(true)
                .path("/api/auth")
                .maxAge(0)
                .sameSite("None")
                .build();
                
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body("Log out successful");
    }
}

@Data
class TokenRefreshRequest {
    private String refreshToken;
}

@Data
class TokenRefreshResponse {
    private String token;
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserDto user;
    private java.util.Set<String> roles;
    private java.util.Set<String> permissions;

    public TokenRefreshResponse(String accessToken, String refreshToken, Long expiresIn, UserDto user, java.util.Set<String> roles, java.util.Set<String> permissions) {
        this.token = accessToken;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.user = user;
        this.roles = roles;
        this.permissions = permissions;
    }
}
