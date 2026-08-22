package com.healthcare.clinic.laboratory.controller;

import com.healthcare.clinic.clinicaldecision.event.LabTestOrderedEvent;
import com.healthcare.clinic.laboratory.event.LabResultCriticalEvent;
import com.healthcare.clinic.laboratory.event.LabStatusChangedEvent;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/sse/lab")
@Slf4j
public class LabSseController {

    public static class ClientConnection {
        final SseEmitter emitter;
        final Long userId;
        final boolean isPrivilegedLabUser;

        ClientConnection(SseEmitter emitter, Long userId, boolean isPrivilegedLabUser) {
            this.emitter = emitter;
            this.userId = userId;
            this.isPrivilegedLabUser = isPrivilegedLabUser;
        }
    }

    private final List<ClientConnection> connections = new CopyOnWriteArrayList<>();

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter subscribe(@AuthenticationPrincipal UserPrincipal user) {
        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L); // 1 hour timeout
        
        boolean isPrivileged = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LAB_TECH") || 
                               a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
                               a.getAuthority().equals("ROLE_PATHOLOGIST") ||
                               a.getAuthority().equals("ROLE_LAB_SENIOR"));
        
        ClientConnection connection = new ClientConnection(emitter, user.getUserId(), isPrivileged);
        connections.add(connection);

        emitter.onCompletion(() -> connections.remove(connection));
        emitter.onTimeout(() -> connections.remove(connection));
        emitter.onError(e -> connections.remove(connection));

        return emitter;
    }

    @EventListener
    public void onLabTestOrdered(LabTestOrderedEvent event) {
        broadcastEvent("lab-request-new", event, event.getPatientId(), event.getDoctorId());
    }

    @EventListener
    public void onLabResultCritical(LabResultCriticalEvent event) {
        broadcastEvent("lab-result-critical", event, event.getPatientId(), event.getDoctorId());
    }

    @EventListener
    public void onLabStatusChanged(LabStatusChangedEvent event) {
        broadcastEvent("lab-status-changed", event, null, null);
    }

    private void broadcastEvent(String name, Object eventData, Long targetPatientId, Long targetDoctorId) {
        List<ClientConnection> deadConnections = new CopyOnWriteArrayList<>();
        
        for (ClientConnection conn : connections) {
            boolean canView = conn.isPrivilegedLabUser;
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
