package com.healthcare.clinic.doctor.medicine.controller;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.appointment.event.AppointmentBookedEvent;
import com.healthcare.clinic.doctor.medicine.event.DoctorMedicineChangedEvent;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.healthcare.clinic.security.SseTicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sse/patient-medicines")
@RequiredArgsConstructor
@Slf4j
public class PatientMedicineSseController {

    private final AppointmentRepository appointmentRepository;
    private final SseTicketService sseTicketService;

    private static class ClientConnection {
        final SseEmitter emitter;
        final Long userId;

        ClientConnection(SseEmitter emitter, Long userId) {
            this.emitter = emitter;
            this.userId = userId;
        }
    }

    private final List<ClientConnection> connections = new CopyOnWriteArrayList<>();
    
    // Cache: doctorId -> set of patient user IDs
    private final Map<Long, List<Long>> doctorToPatientsCache = new ConcurrentHashMap<>();

    @PostMapping("/ticket")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> generateTicket(@AuthenticationPrincipal UserPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        String ticket = sseTicketService.generateTicket(user);
        return ResponseEntity.ok(Map.of("ticket", ticket));
    }

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(value = "ticket", required = false) String ticket) {
        UserPrincipal principal = user;
        if (principal == null && StringUtils.hasText(ticket)) {
            SseTicketService.TicketDetails details = sseTicketService.consumeTicket(ticket);
            if (details != null) {
                principal = details.userPrincipal();
            }
        }
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required for patient medicine SSE stream");
        }

        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L); // 1 hour timeout
        
        ClientConnection connection = new ClientConnection(emitter, principal.getUserId());
        connections.add(connection);

        emitter.onCompletion(() -> connections.remove(connection));
        emitter.onTimeout(() -> connections.remove(connection));
        emitter.onError(e -> connections.remove(connection));

        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDoctorMedicineChanged(DoctorMedicineChangedEvent event) {
        Long doctorId = event.getDoctorId();
        
        // Use a simple cache to avoid DB hits on every medicine update.
        // In a real prod app, invalidate this cache when new appointments are booked.
        List<Long> patientUserIds = doctorToPatientsCache.computeIfAbsent(doctorId, id -> {
            List<Appointment> appointments = appointmentRepository.findByDoctorId(id);
            return appointments.stream()
                    .map(a -> a.getPatient().getUserId())
                    .distinct()
                    .collect(Collectors.toList());
        });

        broadcastToPatients("medicines_updated", event, patientUserIds);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAppointmentBooked(AppointmentBookedEvent event) {
        doctorToPatientsCache.remove(event.getDoctorUserId());
    }

    private void broadcastToPatients(String name, Object eventData, List<Long> patientUserIds) {
        List<ClientConnection> deadConnections = new CopyOnWriteArrayList<>();
        
        for (ClientConnection conn : connections) {
            if (patientUserIds.contains(conn.userId)) {
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
