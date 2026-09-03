package com.healthcare.clinic.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Slf4j
public class RateLimitAndAuditInterceptor implements HandlerInterceptor {

    private final ConcurrentHashMap<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> requestTimestamps = new ConcurrentHashMap<>();

    private static final int MAX_REQUESTS_PER_MINUTE = 30;
    private static final long MINUTE_IN_MS = 60000;
    private static final int MAX_MAP_SIZE = 1000;

    private String getClientIdentifier(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip != null ? ip : "unknown";
    }

    private void evictOldEntries(long currentTime) {
        if (requestTimestamps.size() > MAX_MAP_SIZE) {
            requestTimestamps.entrySet().removeIf(entry -> 
                currentTime - entry.getValue() > MINUTE_IN_MS);
            requestCounts.keySet().retainAll(requestTimestamps.keySet());
        }
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String uri = request.getRequestURI();
        
        // Apply to all auth endpoints (including portal logins like /api/auth/doctor/login)
        if (uri != null && uri.startsWith("/api/auth/") && (uri.endsWith("/login") || uri.contains("/login/mfa") || uri.endsWith("/register"))) {
            String clientId = getClientIdentifier(request);
            String key = clientId + ":" + uri;

            long currentTime = System.currentTimeMillis();
            evictOldEntries(currentTime);
            requestTimestamps.putIfAbsent(key, currentTime);

            if (currentTime - requestTimestamps.get(key) > MINUTE_IN_MS) {
                requestCounts.put(key, new AtomicInteger(0));
                requestTimestamps.put(key, currentTime);
            }

            AtomicInteger count = requestCounts.computeIfAbsent(key, k -> new AtomicInteger(0));
            
            if (count.incrementAndGet() > MAX_REQUESTS_PER_MINUTE) {
                log.warn("AUDIT ALARM: Rate limit exceeded for ID {} on URI {}", clientId, uri);
                String origin = request.getHeader("Origin");
                if (origin != null && !origin.isBlank()) {
                    response.setHeader("Access-Control-Allow-Origin", origin);
                    response.setHeader("Access-Control-Allow-Credentials", "true");
                }
                response.setStatus(429); // Too Many Requests
                response.getWriter().write("Too many requests. Please try again later.");
                return false;
            }

            log.info("AUDIT LOG: Authentication attempt from ID {} to URI {}", clientId, uri);
        }

        return true;
    }
}
