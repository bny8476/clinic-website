package com.healthcare.clinic.support.controller;

import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.support.entity.SupportMessage;
import com.healthcare.clinic.support.entity.SupportTicket;
import com.healthcare.clinic.support.service.SupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    @GetMapping("/tickets")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPPORT', 'ROLE_CUSTOMER_SUPPORT', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<SupportTicket>> getAllTickets() {
        return ResponseEntity.ok(supportService.getAllTickets());
    }

    @GetMapping("/my-tickets")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SupportTicket>> getMyTickets(
            @AuthenticationPrincipal UserPrincipal user) {

        Long userId = user != null ? user.getUserId() : null;

        return ResponseEntity.ok(
                supportService.getUserTickets(userId)
        );
    }

    @PostMapping("/tickets")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SupportTicket> createTicket(
            @RequestBody SupportTicket ticket,
            @RequestParam(required = false) String initialMessage,
            @AuthenticationPrincipal UserPrincipal user) {

        return ResponseEntity.ok(
                supportService.createTicket(
                        ticket,
                        user,
                        initialMessage
                )
        );
    }

    @GetMapping("/tickets/{ticketId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SupportMessage>> getMessages(
            @PathVariable Long ticketId) {

        return ResponseEntity.ok(
                supportService.getTicketMessages(ticketId)
        );
    }

    @PostMapping("/tickets/{ticketId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SupportMessage> addMessage(
            @PathVariable Long ticketId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal sender) {

        String text = body.get("message");

        boolean isAgent = sender != null &&
                sender.getAuthorities().stream()
                        .anyMatch(r ->
                                r.getAuthority().equals("ROLE_SUPPORT")
                                || r.getAuthority().equals("ROLE_CUSTOMER_SUPPORT")
                                || r.getAuthority().equals("ROLE_SUPER_ADMIN")
                        );

        return ResponseEntity.ok(
                supportService.addMessage(
                        ticketId,
                        sender,
                        text,
                        isAgent
                )
        );
    }

    @PatchMapping("/tickets/{ticketId}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPPORT', 'ROLE_CUSTOMER_SUPPORT', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<SupportTicket> updateStatus(
            @PathVariable Long ticketId,
            @RequestParam String status) {

        return ResponseEntity.ok(
                supportService.updateTicketStatus(ticketId, status)
        );
    }
}