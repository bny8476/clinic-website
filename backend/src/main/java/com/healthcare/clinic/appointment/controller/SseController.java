package com.healthcare.clinic.appointment.controller;

import com.healthcare.clinic.appointment.event.AppointmentBookedEvent;
import com.healthcare.clinic.appointment.event.AppointmentStatusChangedEvent;
import com.healthcare.clinic.notification.event.AppointmentCancelledEvent;
import com.healthcare.clinic.notification.event.QueueTokenCalledEvent;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import com.healthcare.clinic.security.SseTicketService;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/sse/appointments")
@Slf4j
public class SseController {

    private final SseTicketService sseTicketService;

    public SseController(SseTicketService sseTicketService) {
        this.sseTicketService = sseTicketService;
    }

    private static class ClientConnection {
        final SseEmitter emitter;
        final Long userId;
        final boolean isAdminOrReceptionist;

        ClientConnection(SseEmitter emitter, Long userId, boolean isAdminOrReceptionist) {
            this.emitter = emitter;
            this.userId = userId;
            this.isAdminOrReceptionist = isAdminOrReceptionist;
        }
    }

    private final List<ClientConnection> connections = new CopyOnWriteArrayList<>();

    @PostMapping("/ticket")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> generateTicket(@AuthenticationPrincipal UserPrincipal user) {
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_RECEPTION"));
        String ticket = sseTicketService.generateTicket(user.getUserId(), isAdmin);
        return ResponseEntity.ok(Map.of("ticket", ticket));
    }

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestParam("ticket") String ticket) {
        SseTicketService.TicketDetails details = sseTicketService.consumeTicket(ticket);
        if (details == null) {
            throw new org.springframework.security.access.AccessDeniedException("Invalid or expired SSE ticket");
        }

        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L); // 1 hour timeout
        
        ClientConnection connection = new ClientConnection(emitter, details.userId(), details.isAdminOrReceptionist());
        connections.add(connection);

        emitter.onCompletion(() -> connections.remove(connection));
        emitter.onTimeout(() -> connections.remove(connection));
        emitter.onError(e -> connections.remove(connection));

        return emitter;
    }

    @EventListener
    public void onAppointmentBooked(AppointmentBookedEvent event) {
        broadcastEvent("appointment-booked", event, event.getPatientUserId(), event.getDoctorUserId());
    }

    @EventListener
    public void onAppointmentCancelled(AppointmentCancelledEvent event) {
        broadcastEvent("appointment-cancelled", event, event.getPatientUserId(), event.getDoctorUserId());
    }

    @EventListener
    public void onAppointmentStatusChanged(AppointmentStatusChangedEvent event) {
        broadcastEvent("appointment-status-changed", event, null, event.getDoctorUserId());
    }

    @EventListener
    public void onQueueTokenCalled(QueueTokenCalledEvent event) {
        broadcastEvent("queue-token-called", event, event.getPatientUserId(), null);
    }

    private void broadcastEvent(String name, Object eventData, Long targetPatientId, Long targetDoctorId) {
        List<ClientConnection> deadConnections = new CopyOnWriteArrayList<>();
        
        for (ClientConnection conn : connections) {
            // Filter logic: Admins see everything. Otherwise, the user ID must match the patient ID or doctor ID.
            boolean canView = conn.isAdminOrReceptionist;
            if (!canView && targetPatientId != null && targetPatientId.equals(conn.userId)) canView = true;
            if (!canView && targetDoctorId != null && targetDoctorId.equals(conn.userId)) canView = true;
            
            if (canView) {
                try {
                    conn.emitter.send(SseEmitter.event().name(name).data(eventData));
                } catch (IOException e) {
                    deadConnections.add(conn);
                }
            }
        }
        
        connections.removeAll(deadConnections);
    }
}
