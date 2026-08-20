package com.healthcare.clinic.support.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.support.entity.SpTicket;
import com.healthcare.clinic.support.service.TicketService;
import com.healthcare.clinic.support.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/support/agent")
@PreAuthorize("hasAuthority('ROLE_SUPPORT') or hasAuthority('ROLE_CUSTOMER_SUPPORT') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class AgentDeskController {
    
    private final TicketService ticketService;
    private final AssignmentService assignmentService;
    
    @GetMapping("/tickets")
    public ResponseEntity<List<SpTicket>> getOpenTickets() {
        return ResponseEntity.ok(ticketService.getOpenTickets());
    }
    
    @PostMapping("/tickets/{ticketId}/assign")
    public ResponseEntity<SpTicket> claimTicket(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal User agent) {
        // Agent claims ticket for themselves
        return ResponseEntity.ok(assignmentService.assignTicket(ticketId, agent, agent, "Agent self-assigned"));
    }
    
    @PutMapping("/tickets/{ticketId}/status")
    public ResponseEntity<SpTicket> updateTicketStatus(
            @PathVariable Long ticketId,
            @RequestParam String status,
            @AuthenticationPrincipal User agent) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(ticketId, status, agent));
    }
}
