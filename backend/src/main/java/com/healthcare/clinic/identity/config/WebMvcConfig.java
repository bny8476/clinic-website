package com.healthcare.clinic.identity.config;

import com.healthcare.clinic.security.RateLimitAndAuditInterceptor;
import com.healthcare.clinic.tenant.interceptor.TenantInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final RateLimitAndAuditInterceptor rateLimitAndAuditInterceptor;
    private final TenantInterceptor tenantInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitAndAuditInterceptor).addPathPatterns("/api/auth/**");
        registry.addInterceptor(tenantInterceptor).addPathPatterns("/api/**");
    }

    // Uploads are now served via an authenticated REST controller,
    // not as a publicly accessible static resource directory.

    @Override
    public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        "https://clinic-website-bny2.vercel.app",
                        "https://clinic-website-three-chi.vercel.app",
                        "https://clinic-website-ndzj.onrender.com",
                        "http://localhost:5173",
                        "http://localhost:3000",
                        "http://localhost:5174"
                )
                .allowedOriginPatterns(
                        "https://*.onrender.com",
                        "https://*.vercel.app",
                        "http://localhost:*",
                        "http://127.0.0.1:*"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "x-auth-token", "Idempotency-Key", "Content-Disposition")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
