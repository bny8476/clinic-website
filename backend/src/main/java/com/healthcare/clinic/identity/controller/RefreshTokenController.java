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
                                .sameSite("Strict")
                                .build();

                        return ResponseEntity.ok()
                                .header(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString())
                                .body(new TokenRefreshResponse(token, newRefreshToken));
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
                .sameSite("Strict")
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
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";

    public TokenRefreshResponse(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
