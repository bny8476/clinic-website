package com.healthcare.clinic.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class SseTicketService {

    public record TicketDetails(UserPrincipal userPrincipal, Long userId, boolean isAdminOrReceptionist) {
        public Long getUserId() {
            if (userId != null) return userId;
            return userPrincipal != null ? userPrincipal.getUserId() : null;
        }
    }

    private final Map<String, TicketDetails> tickets = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    public String generateTicket(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new IllegalArgumentException("UserPrincipal cannot be null");
        }
        boolean isAdmin = userPrincipal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_RECEPTION") ||
                               a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        String ticketId = UUID.randomUUID().toString();
        tickets.put(ticketId, new TicketDetails(userPrincipal, userPrincipal.getUserId(), isAdmin));
        
        // Ticket expires in 30 seconds
        scheduler.schedule(() -> tickets.remove(ticketId), 30, TimeUnit.SECONDS);
        
        return ticketId;
    }

    public String generateTicket(Long userId, boolean isAdminOrReceptionist) {
        String ticketId = UUID.randomUUID().toString();
        tickets.put(ticketId, new TicketDetails(null, userId, isAdminOrReceptionist));
        
        scheduler.schedule(() -> tickets.remove(ticketId), 30, TimeUnit.SECONDS);
        
        return ticketId;
    }

    public TicketDetails consumeTicket(String ticketId) {
        if (ticketId == null || ticketId.isBlank()) return null;
        return tickets.remove(ticketId);
    }
}

