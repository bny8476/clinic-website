package com.healthcare.clinic.ai.service;

import com.healthcare.clinic.ai.config.GroqConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class GroqClient {

    private final GroqConfig groqConfig;
    private final RestTemplate restTemplate;

    public GroqClient(GroqConfig groqConfig, @Qualifier("groqRestTemplate") RestTemplate restTemplate) {
        this.groqConfig = groqConfig;
        this.restTemplate = restTemplate;
    }

    @SuppressWarnings("unchecked")
    public String chatCompletion(List<Map<String, String>> messages) {
        String apiKey = groqConfig.getApiKey();
        if (apiKey == null || apiKey.trim().isEmpty() || "dummy".equalsIgnoreCase(apiKey) || "mock_key".equalsIgnoreCase(apiKey)) {
            log.warn("Groq API key is not configured or is dummy.");
            return "The AI assistant is currently unavailable due to unconfigured service parameters.";
        }

        String model = groqConfig.getModel();
        if (model == null || model.trim().isEmpty()) {
            model = "openai/gpt-oss-20b";
        }

        String apiUrl = groqConfig.getApiUrl();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey.trim());

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.6);
            requestBody.put("max_tokens", 1024);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Sending chat request to Groq API using model: {}", model);
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    Map<String, Object> messageMap = (Map<String, Object>) firstChoice.get("message");
                    if (messageMap != null && messageMap.containsKey("content")) {
                        return (String) messageMap.get("content");
                    }
                }
            }

            log.error("Groq API returned unexpected response structure: {}", response.getStatusCode());
            return "The AI assistant returned an unexpected response format. Please try again.";

        } catch (HttpClientErrorException.TooManyRequests e) {
            log.error("Groq API Rate limit 429 encountered");
            return "The AI assistant is temporarily busy due to rate limits. Please try again in a few moments.";
        } catch (HttpClientErrorException.Unauthorized e) {
            log.error("Groq API key authentication 401 failed");
            return "The AI assistant is currently unavailable.";
        } catch (HttpClientErrorException e) {
            log.error("Groq API HTTP client error: {}", e.getStatusCode());
            return "The AI assistant encountered a request processing error.";
        } catch (HttpServerErrorException e) {
            log.error("Groq API Server error: {}", e.getStatusCode());
            return "The AI assistant backend service is temporarily experiencing high load. Please try again later.";
        } catch (ResourceAccessException e) {
            log.error("Groq API Network/Timeout error: {}", e.getMessage());
            return "The AI assistant took too long to respond. Please try again.";
        } catch (Exception e) {
            log.error("Unexpected error invoking Groq API: {}", e.getMessage());
            return "An unexpected error occurred while communicating with the AI assistant.";
        }
    }
}
