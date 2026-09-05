package com.healthcare.clinic.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
@Slf4j
@RequiredArgsConstructor
public class AuthTokenFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getServletPath();
        if (path == null || path.isEmpty()) {
            path = request.getRequestURI();
        }

        return path.startsWith("/api/auth/")
                || path.equals("/api/health")
                || path.equals("/error")
                || path.startsWith("/api/sse/")
                || path.startsWith("/api/notifications/stream");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            String jwt = parseJwt(request);

            log.info(
                "AUTH REQUEST: {} {} | tokenPresent={}",
                request.getMethod(),
                request.getRequestURI(),
                jwt != null
            );

            if (jwt != null) {
                log.info("JWT validation result for {}: {}", request.getRequestURI(), jwtUtils.validateJwtToken(jwt));
            }

            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {

                io.jsonwebtoken.Claims claims = jwtUtils.getClaimsFromJwtToken(jwt);

                String username = claims.getSubject();
                Long userId = claims.get("userId", Long.class);
                Long branchId = claims.get("branchId", Long.class);

                List<String> roles = claims.get("roles", List.class);

                if (roles == null) {
                    roles = Collections.emptyList();
                }

                log.info(
                    "JWT AUTH: username={}, userId={}, roles={}",
                    username,
                    userId,
                    roles
                );

                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                for (String r : roles) {
                    if (r == null || r.isBlank()) continue;
                    String cleanRole = r.trim().toUpperCase();
                    String roleWithPrefix = cleanRole.startsWith("ROLE_") ? cleanRole : "ROLE_" + cleanRole;
                    String roleWithoutPrefix = cleanRole.startsWith("ROLE_") ? cleanRole.substring(5) : cleanRole;
                    
                    authorities.add(new SimpleGrantedAuthority(roleWithPrefix));
                    authorities.add(new SimpleGrantedAuthority(roleWithoutPrefix));

                    if (roleWithPrefix.equals("ROLE_SUPER_ADMIN")) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                        authorities.add(new SimpleGrantedAuthority("ADMIN"));
                    }
                }

                UserPrincipal userPrincipal =
                        new UserPrincipal(userId, username, authorities, branchId);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userPrincipal,
                                null,
                                userPrincipal.getAuthorities()
                        );

                log.info(
                    "SPRING AUTH: authorities={}",
                    authentication.getAuthorities()
                );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                               .buildDetails(request)
                );

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
            }

        } catch (Exception e) {
            log.error(
                "Cannot set user authentication for {} {}",
                request.getMethod(),
                request.getRequestURI(),
                e
            );
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {

        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth)
                && headerAuth.startsWith("Bearer ")) {

            return headerAuth.substring(7);
        }

        return null;
    }
}
