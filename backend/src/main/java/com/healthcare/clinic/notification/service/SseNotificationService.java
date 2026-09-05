package com.healthcare.clinic.notification.service;

import com.healthcare.clinic.notification.entity.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SseNotificationService {

    private final Map<Long, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30 minutes timeout
        
        userEmitters.computeIfAbsent(userId, k -> new java.util.concurrent.CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(e -> removeEmitter(userId, emitter));

        try {
            // Send initial handshake ping
            emitter.send(SseEmitter.event().name("INIT").data("Connected to Notification Stream"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        log.info("User {} subscribed to SSE notifications", userId);
        return emitter;
    }

    public void pushToUser(Long userId, Notification notification) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(notification));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
        }
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 20000)
    public void sendHeartbeats() {
        userEmitters.forEach((userId, emitters) -> {
            List<SseEmitter> deadEmitters = new ArrayList<>();
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().comment("heartbeat"));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            }
            if (!deadEmitters.isEmpty()) {
                emitters.removeAll(deadEmitters);
            }
        });
        userEmitters.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }
}
