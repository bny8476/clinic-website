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
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll();
                auth.requestMatchers("/api/auth/**", "/api/health", "/api/pharmacy/config/public", "/error").permitAll();
                auth.requestMatchers(org.springframework.http.HttpMethod.POST, "/api/ai/chat", "/api/v1/ai/chat").permitAll();
                auth.requestMatchers(org.springframework.http.HttpMethod.GET, "/api/sse/**", "/api/notifications/stream").permitAll();
                auth.requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/finance/payments/webhook/stripe", "/api/reception/kiosk/self-checkin").permitAll();
                if (!isProd) {
                    auth.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
                }
                auth.requestMatchers(org.springframework.http.HttpMethod.GET, "/api/doctors", "/api/doctors/**", "/api/departments", "/api/departments/**", "/api/clinic/stats").permitAll();
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
        java.util.List<String> patterns = new java.util.ArrayList<>();
        boolean isProd = isProduction(env);

        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            for (String origin : allowedOrigins.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty()) {
                    patterns.add(trimmed);
                }
            }
        }

        if (isProd) {
            if (!patterns.contains("https://clinic-website-bny2.vercel.app")) {
                patterns.add("https://clinic-website-bny2.vercel.app");
            }
        } else {
            if (patterns.isEmpty()) {
                patterns.add("http://localhost:5173");
                patterns.add("http://localhost:3000");
                patterns.add("http://localhost:5174");
            }
            patterns.add("http://localhost:*");
            patterns.add("http://127.0.0.1:*");
            if (!patterns.contains("https://clinic-website-bny2.vercel.app")) {
                patterns.add("https://clinic-website-bny2.vercel.app");
            }
        }

        configuration.setAllowedOriginPatterns(patterns);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "Accept", "Origin", 
            "X-Requested-With", "x-auth-token", "Idempotency-Key", 
            "Cache-Control", "Pragma", "Expires", "X-Active-Role"
        ));
        configuration.setExposedHeaders(Arrays.asList("x-auth-token", "Authorization", "Idempotency-Key"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
