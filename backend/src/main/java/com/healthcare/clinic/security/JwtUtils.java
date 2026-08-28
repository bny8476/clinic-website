package com.healthcare.clinic.security;

import com.healthcare.clinic.identity.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JwtUtils {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration-ms:86400000}")
    private long jwtExpirationMs;

    @PostConstruct
    public void init() {
        if (!StringUtils.hasText(jwtSecret) || jwtSecret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET is missing or too short. It must be at least 32 characters long for HS256.");
        }
    }

    private Key key() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateJwtToken(Authentication authentication) {
        if (authentication.getPrincipal() instanceof UserPrincipal principal) {
            List<String> roles = principal.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            return generateAccessToken(
                    principal.getUsername(),
                    principal.getUserId(),
                    principal.getBranchId(),
                    roles
            );
        } else if (authentication.getPrincipal() instanceof User userPrincipal) {
            List<String> roles = userPrincipal.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            return generateAccessToken(
                    userPrincipal.getUsername(),
                    userPrincipal.getId(),
                    userPrincipal.getBranchId(),
                    roles
            );
        } else if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            return generateAccessToken(
                    userDetails.getUsername(),
                    null,
                    null,
                    roles
            );
        }
        
        return generateAccessToken(authentication.getName(), null, null, List.of());
    }

    public String generateAccessToken(String username, Long userId, Long branchId, List<String> roles) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        var builder = Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate);

        if (userId != null) {
            builder.claim("userId", userId);
        }
        if (branchId != null) {
            builder.claim("branchId", branchId);
        }
        if (roles != null && !roles.isEmpty()) {
            builder.claim("roles", roles);
        }

        return builder
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return getClaimsFromJwtToken(token).getSubject();
    }

    public Claims getClaimsFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
        }
        return false;
    }

    public boolean validateRefreshToken(String refreshToken) {
        return validateJwtToken(refreshToken);
    }
}
