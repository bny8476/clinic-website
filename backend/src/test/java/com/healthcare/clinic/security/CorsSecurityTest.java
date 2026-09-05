package com.healthcare.clinic.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.core.env.Environment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class CorsSecurityTest {

    @Test
    @DisplayName("Production profile: CORS must NOT contain localhost wildcards while trusting Vercel frontend domains")
    void testProductionCorsTightened() {
        SecurityConfig securityConfig = new SecurityConfig(null, null, null);
        ReflectionTestUtils.setField(securityConfig, "allowedOrigins", "");

        Environment env = Mockito.mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});

        CorsConfigurationSource source = securityConfig.corsConfigurationSource(env);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/patients");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertNotNull(config, "CORS configuration should not be null");
        List<String> patterns = config.getAllowedOriginPatterns();
        assertNotNull(patterns, "Allowed origin patterns should not be null");

        // Verify localhost wildcards are excluded in production
        assertFalse(patterns.contains("https://*.up.railway.app"), "Production CORS must not contain broad *.up.railway.app wildcard");
        assertFalse(patterns.contains("http://localhost:*"), "Production CORS must not contain http://localhost:* wildcard");
        assertFalse(patterns.contains("http://127.0.0.1:*"), "Production CORS must not contain http://127.0.0.1:* wildcard");

        // Verify default trusted Vercel domains are present
        assertTrue(patterns.contains("https://clinic-website-bny2.vercel.app"));
        assertTrue(patterns.contains("https://*.vercel.app"));
    }

    @Test
    @DisplayName("Production profile: Custom explicit origins from configuration are respected along with Vercel frontend")
    void testProductionCorsWithExplicitAllowedOrigins() {
        SecurityConfig securityConfig = new SecurityConfig(null, null, null);
        ReflectionTestUtils.setField(securityConfig, "allowedOrigins", "https://my-hospital-domain.com, https://portal.clinic.com");

        Environment env = Mockito.mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});

        CorsConfigurationSource source = securityConfig.corsConfigurationSource(env);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/patients");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertNotNull(config);
        List<String> patterns = config.getAllowedOriginPatterns();

        assertTrue(patterns.contains("https://my-hospital-domain.com"));
        assertTrue(patterns.contains("https://portal.clinic.com"));
        assertTrue(patterns.contains("https://clinic-website-bny2.vercel.app"));
        assertTrue(patterns.contains("https://*.vercel.app"));
        assertFalse(patterns.contains("http://localhost:*"));
    }

    @Test
    @DisplayName("Development profile: Localhost origins are enabled for local frontend development")
    void testDevelopmentCorsAllowsLocalhost() {
        SecurityConfig securityConfig = new SecurityConfig(null, null, null);
        ReflectionTestUtils.setField(securityConfig, "allowedOrigins", "");

        Environment env = Mockito.mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"dev"});

        CorsConfigurationSource source = securityConfig.corsConfigurationSource(env);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/patients");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertNotNull(config);
        List<String> patterns = config.getAllowedOriginPatterns();

        assertTrue(patterns.contains("http://localhost:*"));
        assertTrue(patterns.contains("http://127.0.0.1:*"));
        assertTrue(patterns.contains("https://clinic-website-bny2.vercel.app"));
    }

    @Test
    @DisplayName("Preflight OPTIONS request must return Access-Control-Allow-Origin for Vercel origin")
    void testPreflightCorsHandling() throws Exception {
        SecurityConfig securityConfig = new SecurityConfig(null, null, null);
        ReflectionTestUtils.setField(securityConfig, "allowedOrigins", "");

        Environment env = Mockito.mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});

        CorsConfigurationSource source = securityConfig.corsConfigurationSource(env);
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/health");
        request.addHeader("Origin", "https://clinic-website-bny2.vercel.app");
        request.addHeader("Access-Control-Request-Method", "GET");
        request.addHeader("Access-Control-Request-Headers", "authorization, content-type");

        org.springframework.mock.web.MockHttpServletResponse response = new org.springframework.mock.web.MockHttpServletResponse();

        org.springframework.web.cors.DefaultCorsProcessor processor = new org.springframework.web.cors.DefaultCorsProcessor();
        CorsConfiguration config = source.getCorsConfiguration(request);
        boolean isValid = processor.processRequest(config, request, response);

        assertTrue(isValid, "CORS preflight request should be valid");
        assertEquals("https://clinic-website-bny2.vercel.app", response.getHeader("Access-Control-Allow-Origin"));
        assertEquals("true", response.getHeader("Access-Control-Allow-Credentials"));
    }
}
