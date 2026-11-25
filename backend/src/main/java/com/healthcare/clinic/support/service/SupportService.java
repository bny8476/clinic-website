package com.healthcare.clinic.support.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.support.entity.SupportMessage;
import com.healthcare.clinic.support.entity.SupportTicket;
import com.healthcare.clinic.support.repository.SupportMessageRepository;
import com.healthcare.clinic.support.repository.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final SupportTicketRepository ticketRepository;
    private final SupportMessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SupportTicket> getAllTickets() {
        List<SupportTicket> list = ticketRepository.findAllByOrderByCreatedAtDesc();
        populateDescriptions(list);
        return list;
    }

    @Transactional(readOnly = true)
    public List<SupportTicket> getUserTickets(Long userId) {
        if (userId == null) return List.of();
        List<SupportTicket> list = new java.util.ArrayList<>(ticketRepository.findByUserId(userId));
        list.sort((a, b) -> {
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });
        populateDescriptions(list);
        return list;
    }

    private void populateDescriptions(List<SupportTicket> tickets) {
        for (SupportTicket t : tickets) {
            List<SupportMessage> msgs = messageRepository.findByTicketIdOrderByCreatedAtAsc(t.getId());
            if (!msgs.isEmpty()) {
                t.setDescription(msgs.get(0).getMessage());
            }
        }
    }

    @Transactional
    public SupportTicket createTicket(SupportTicket ticket, UserPrincipal userPrincipal, String initialMessage) {
        User user = userPrincipal != null && userPrincipal.getUserId() != null
                ? userRepository.findById(userPrincipal.getUserId()).orElse(null)
                : null;

        ticket.setUser(user);
        if (ticket.getTicketNumber() == null || ticket.getTicketNumber().isEmpty()) {
            ticket.setTicketNumber("TICK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        if (ticket.getStatus() == null || ticket.getStatus().isEmpty()) {
            ticket.setStatus("OPEN");
        }
        SupportTicket savedTicket = ticketRepository.save(ticket);

        String msg = (initialMessage != null && !initialMessage.isEmpty())
                ? initialMessage
                : ticket.getDescription();

        if (msg != null && !msg.isEmpty()) {
            messageRepository.save(SupportMessage.builder()
                    .ticket(savedTicket)
                    .sender(user)
                    .message(msg)
                    .isAgentResponse(false)
                    .build());
            savedTicket.setDescription(msg);
        }
        return savedTicket;
    }

    @Transactional(readOnly = true)
    public List<SupportMessage> getTicketMessages(Long ticketId) {
        return messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @Transactional
    public SupportMessage addMessage(Long ticketId, UserPrincipal senderPrincipal, String text, boolean isAgent) {
        SupportTicket ticket = ticketRepository.findById(ticketId).orElseThrow();
        
        User sender = senderPrincipal != null && senderPrincipal.getUserId() != null
                ? userRepository.findById(senderPrincipal.getUserId()).orElse(null)
                : null;

        if (isAgent && "OPEN".equals(ticket.getStatus())) {
            ticket.setStatus("IN_PROGRESS");
            ticket.setAssignedAgent(sender);
            ticketRepository.save(ticket);
        }

        SupportMessage message = SupportMessage.builder()
                .ticket(ticket)
                .sender(sender)
                .message(text)
                .isAgentResponse(isAgent)
                .build();
        return messageRepository.save(message);
    }

    @Transactional
    public SupportTicket updateTicketStatus(Long ticketId, String status) {
        SupportTicket ticket = ticketRepository.findById(ticketId).orElseThrow();
        ticket.setStatus(status);
        return ticketRepository.save(ticket);
    }
}
