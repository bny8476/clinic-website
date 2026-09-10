package com.healthcare.clinic.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIAssistantService {

    private final PhiSanitizer phiSanitizer;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent}")
    private String geminiApiUrl;

    @Value("${gemini.api.key:dummy}")
    private String geminiApiKey;

    @SuppressWarnings("unchecked")
    public String generateChatResponse(String input) {
        log.info("Received query for AI Assistant: {}", input);
        
        String sanitizedInput = phiSanitizer.sanitize(input);
        
        if ("mock_key".equals(geminiApiKey) || geminiApiKey.isEmpty()) {
            return mockResponse(sanitizedInput);
        }

        try {
            String url = geminiApiUrl + "?key=" + geminiApiKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> part = new HashMap<>();
            part.put("text", "You are a helpful medical clinic assistant. " + sanitizedInput);
            
            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));
            
            Map<String, Object> body = new HashMap<>();
            body.put("contents", List.of(content));
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(url, entity, (Class<Map<String, Object>>) (Class<?>) Map.class);
            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody != null && responseBody.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> contentMap = (Map<String, Object>) firstCandidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
            return "I'm sorry, I could not process your request at this time.";
        } catch (Exception e) {
            log.error("Failed to call Gemini API", e);
            return mockResponse(sanitizedInput); // fallback
        }
    }
    
    private String mockResponse(String sanitizedInput) {
        String lowerInput = sanitizedInput.toLowerCase();
        if (lowerInput.contains("fever") || lowerInput.contains("headache")) {
            return "Fever and headache can stem from viral infections or fatigue. Make sure to stay hydrated. If fever exceeds 101°F for > 2 days, please consult Dr. Ramesh Rao.";
        } else if (lowerInput.contains("timing") || lowerInput.contains("hour")) {
            return "Elixir Health Care Clinic is open Monday to Saturday from 08:00 AM to 08:00 PM. Emergency services operate 24/7.";
        }
        
        return "Thank you for your message. For acute medical symptoms, please book an appointment with our specialist doctor or contact emergency services.";
    }
}
