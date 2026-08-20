package com.healthcare.clinic.support.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.support.service.CommunicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/webhooks")
@PreAuthorize("hasAuthority('ROLE_SUPPORT') or hasAuthority('ROLE_CUSTOMER_SUPPORT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class OmnichannelWebhookController {
    
    private final CommunicationService communicationService;
    private final UserRepository userRepository;
    
    @PostMapping("/whatsapp")
    public ResponseEntity<String> handleWhatsAppWebhook(@RequestBody Map<String, Object> payload) {
        // In a real application, verify webhook signature, parse the complex WhatsApp JSON
        // Find matching patient by phone number
        // Extract message and ticket ID from context if it's a reply
        // Then call communicationService.addMessage(...)
        
        System.out.println("Received WhatsApp webhook: " + payload);
        return ResponseEntity.ok("OK");
    }
    
    @PostMapping("/email")
    public ResponseEntity<String> handleEmailWebhook(@RequestBody Map<String, Object> payload) {
        // Parse inbound email via SendGrid, Mailgun, or standard webhook format
        // Match ticket ID from subject line regex (e.g. [TKT-12345678])
        System.out.println("Received Email webhook: " + payload);
        return ResponseEntity.ok("OK");
    }
}
