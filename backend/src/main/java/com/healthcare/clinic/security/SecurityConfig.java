package com.healthcare.clinic.security;

import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final AuthTokenFilter authTokenFilter;

    @Value("${cors.allowed-origins:}")
    private String allowedOrigins;

    private boolean isProduction(org.springframework.core.env.Environment env) {
        List<String> profiles = Arrays.asList(env.getActiveProfiles());
        return profiles.contains("prod") || profiles.contains("production") || profiles.contains("railway") || profiles.contains("render");
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, org.springframework.core.env.Environment env, CorsConfigurationSource corsConfigurationSource) throws Exception {
        boolean isProd = isProduction(env);

        http.cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
                .contentTypeOptions(org.springframework.security.config.Customizer.withDefaults())
                .frameOptions(frameOptions -> frameOptions.deny())
                .xssProtection(xss -> xss.headerValue(org.springframework.security.web.header.writers.XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
            )
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(unauthorizedHandler)
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    String origin = request.getHeader("Origin");
                    if (origin != null && !origin.isBlank()) {
                        response.setHeader("Access-Control-Allow-Origin", origin);
                        response.setHeader("Access-Control-Allow-Credentials", "true");
                        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
                        response.setHeader("Access-Control-Allow-Headers", "*");
                    }
                    response.setContentType(org.springframework.http.MediaType.APPLICATION_JSON_VALUE);
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN);
                    final java.util.Map<String, Object> body = new java.util.HashMap<>();
                    body.put("status", jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN);
                    body.put("error", "Forbidden");
                    body.put("message", accessDeniedException.getMessage());
                    body.put("path", request.getServletPath());
                    new com.fasterxml.jackson.databind.ObjectMapper().writeValue(response.getOutputStream(), body);
                })
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll();
                auth.requestMatchers(
                    "/", "/index.html", "/favicon.*", "/assets/**", "/images/**",
                    "/*.png", "/*.svg", "/*.ico", "/*.json", "/*.js", "/*.css",
                    "/env-config.js", "/manifest.webmanifest", "/registerSW.js", "/sw.js", "/workbox-*.js",
                    "/login", "/register", "/admin/**", "/doctor/**", "/patient/**", "/pharmacy/**", "/reception/**", "/nurse/**", "/lab/**", "/unauthorized"
                ).permitAll();
                auth.requestMatchers("/api/auth/**", "/api/health", "/api/pharmacy/config/public", "/error").permitAll();
                auth.requestMatchers(org.springframework.http.HttpMethod.POST, "/api/ai/chat", "/api/v1/ai/chat").permitAll();
                auth.requestMatchers("/api/sse/**", "/api/notifications/stream").permitAll();
                auth.requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/finance/payments/webhook/stripe", "/api/reception/kiosk/self-checkin").permitAll();
                if (!isProd) {
                    auth.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
                }
                auth.requestMatchers(org.springframework.http.HttpMethod.GET, "/api/doctors", "/api/doctors/**", "/api/departments", "/api/departments/**", "/api/clinic/stats", "/api/appointments/available-slots", "/api/appointments/slots", "/api/medicines", "/api/medicines/**", "/api/notifications/unread-count").permitAll();
                auth.requestMatchers(org.springframework.http.HttpMethod.POST, "/api/appointments/guest").permitAll();
                auth.anyRequest().authenticated();
            });
        
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(org.springframework.core.env.Environment env) {
        CorsConfiguration configuration = new CorsConfiguration();
        java.util.List<String> patternOrigins = new java.util.ArrayList<>();
        boolean isProd = isProduction(env);

        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            for (String origin : allowedOrigins.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty()) {
                    if (trimmed.contains("*")) {
                        if (!isProd && !patternOrigins.contains(trimmed)) {
                            patternOrigins.add(trimmed);
                        }
                    } else if (!patternOrigins.contains(trimmed)) {
                        patternOrigins.add(trimmed);
                    }
                }
            }
        }

        // Always ensure explicit production origins are present
        if (!patternOrigins.contains("https://clinic-website-bny2.vercel.app")) {
            patternOrigins.add("https://clinic-website-bny2.vercel.app");
        }
        if (!patternOrigins.contains("https://clinic-website-three-chi.vercel.app")) {
            patternOrigins.add("https://clinic-website-three-chi.vercel.app");
        }
        if (!patternOrigins.contains("https://clinic-website-ndzj.onrender.com")) {
            patternOrigins.add("https://clinic-website-ndzj.onrender.com");
        }

        if (!isProd) {
            if (!patternOrigins.contains("http://localhost:*")) patternOrigins.add("http://localhost:*");
            if (!patternOrigins.contains("http://127.0.0.1:*")) patternOrigins.add("http://127.0.0.1:*");
            if (!patternOrigins.contains("http://localhost:5173")) patternOrigins.add("http://localhost:5173");
            if (!patternOrigins.contains("http://localhost:3000")) patternOrigins.add("http://localhost:3000");
            if (!patternOrigins.contains("http://localhost:5174")) patternOrigins.add("http://localhost:5174");
            if (!patternOrigins.contains("https://*.vercel.app")) patternOrigins.add("https://*.vercel.app");
            if (!patternOrigins.contains("https://*.onrender.com")) patternOrigins.add("https://*.onrender.com");
        }

        configuration.setAllowedOriginPatterns(patternOrigins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("x-auth-token", "Authorization", "Idempotency-Key", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
