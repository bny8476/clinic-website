package com.healthcare.clinic.ai.config;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
@Data
public class GroqConfig {

    @Value("${groq.api.key:${GROQ_API_KEY:}}")
    private String apiKey;

    @Value("${groq.model:${GROQ_MODEL:openai/gpt-oss-20b}}")
    private String model;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String apiUrl;

    @Value("${ai.rate-limit.authenticated:20}")
    private int rateLimitAuthenticated;

    @Value("${ai.rate-limit.anonymous:5}")
    private int rateLimitAnonymous;

    @Bean(name = "groqRestTemplate")
    public RestTemplate groqRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(12000);
        return new RestTemplate(factory);
    }
}
