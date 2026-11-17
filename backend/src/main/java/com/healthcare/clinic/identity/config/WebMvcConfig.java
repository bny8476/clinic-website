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

    @Override
    public void addResourceHandlers(org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/");
    }

    @Override
    public void addViewControllers(org.springframework.web.servlet.config.annotation.ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
        registry.addViewController("/{path:[^\\.]*}").setViewName("forward:/index.html");
        registry.addViewController("/**/{path:[^\\.]*}").setViewName("forward:/index.html");
    }

    // Uploads are now served via an authenticated REST controller,
    // not as a publicly accessible static resource directory.

    @Override
    public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(
                        "https://clinic-website-bny2.vercel.app",
                        "https://clinic-website-three-chi.vercel.app",
                        "https://clinic-website-ndzj.onrender.com",
                        "https://*.onrender.com",
                        "https://*.vercel.app",
                        "http://localhost:5173",
                        "http://localhost:3000",
                        "http://localhost:5174",
                        "http://localhost:*",
                        "http://127.0.0.1:*"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD")
                .allowedHeaders("*")
                .exposedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
