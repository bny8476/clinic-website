package com.healthcare.clinic.lab.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/sse/lab")
@Slf4j
public class LabSseController {

    private final Map<String, SseEmitter> activeEmitters = new ConcurrentHashMap<>();

    @PostMapping("/ticket")
    public ResponseEntity<Map<String, String>> generateTicket() {
        String ticket = UUID.randomUUID().toString();
        return ResponseEntity.ok(Map.of("ticket", ticket));
    }

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestParam(required = false) String ticket) {
        String key = (ticket != null && !ticket.trim().isEmpty()) ? ticket : UUID.randomUUID().toString();
        SseEmitter emitter = new SseEmitter(180_000L); // 3 minutes timeout

        activeEmitters.put(key, emitter);

        emitter.onCompletion(() -> activeEmitters.remove(key));
        emitter.onTimeout(() -> {
            activeEmitters.remove(key);
            emitter.complete();
        });
        emitter.onError(e -> activeEmitters.remove(key));

        try {
            emitter.send(SseEmitter.event().name("connect").data(Map.of("status", "connected", "ticket", key)));
        } catch (IOException e) {
            log.warn("Failed to send initial SSE connect event: {}", e.getMessage());
        }

        return emitter;
    }
}
