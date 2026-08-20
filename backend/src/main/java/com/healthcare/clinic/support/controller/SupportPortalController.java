package com.healthcare.clinic.support.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.support.entity.SpKnowledgeArticle;
import com.healthcare.clinic.support.entity.SpTicket;
import com.healthcare.clinic.support.service.KnowledgeBaseService;
import com.healthcare.clinic.support.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patient/support")
@PreAuthorize("hasAuthority('ROLE_SUPPORT') or hasAuthority('ROLE_CUSTOMER_SUPPORT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class SupportPortalController {
    
    private final TicketService ticketService;
    private final KnowledgeBaseService kbService;
    
    @GetMapping("/tickets")
    public ResponseEntity<List<SpTicket>> getMyTickets(@AuthenticationPrincipal User patient) {
        return ResponseEntity.ok(ticketService.getTicketsByRequester(patient));
    }
    
    @PostMapping("/tickets")
    public ResponseEntity<SpTicket> createTicket(
            @AuthenticationPrincipal User patient,
            @RequestBody SpTicket request) {
        return ResponseEntity.ok(ticketService.createTicket(request, patient));
    }
    
    @GetMapping("/kb/search")
    public ResponseEntity<List<SpKnowledgeArticle>> searchKb(
            @RequestParam String q,
            @AuthenticationPrincipal User user) {
        String audience = (user != null) ? "PATIENTS_ONLY" : "PUBLIC";
        return ResponseEntity.ok(kbService.searchArticles(q, audience));
    }
}
