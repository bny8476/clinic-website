package com.healthcare.clinic.support.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.support.entity.SpTicket;
import com.healthcare.clinic.support.entity.SpTicketAssignment;
import com.healthcare.clinic.support.repository.SpTicketAssignmentRepository;
import com.healthcare.clinic.support.repository.SpTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final SpTicketRepository ticketRepository;
    private final SpTicketAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public SpTicket assignTicket(Long ticketId, UserPrincipal newAgentPrincipal, UserPrincipal assignedByPrincipal, String reason) {
        SpTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User previousAgent = ticket.getAssignedAgent();

        User newAgent = newAgentPrincipal != null && newAgentPrincipal.getUserId() != null
                ? userRepository.findById(newAgentPrincipal.getUserId()).orElse(null)
                : null;

        User assignedBy = assignedByPrincipal != null && assignedByPrincipal.getUserId() != null
                ? userRepository.findById(assignedByPrincipal.getUserId()).orElse(null)
                : null;

        ticket.setAssignedAgent(newAgent);
        if ("NEW".equals(ticket.getStatus()) || "OPEN".equals(ticket.getStatus())) {
            ticket.setStatus("OPEN");
        }
        
        ticketRepository.save(ticket);

        SpTicketAssignment assignment = new SpTicketAssignment();
        assignment.setTicket(ticket);
        assignment.setPreviousAgent(previousAgent);
        assignment.setNewAgent(newAgent);
        assignment.setAssignedBy(assignedBy);
        assignment.setReason(reason);
        assignmentRepository.save(assignment);

        return ticket;
    }
}
