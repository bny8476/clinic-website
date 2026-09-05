package com.healthcare.clinic.notification.controller;

import com.healthcare.clinic.notification.entity.Notification;
import com.healthcare.clinic.notification.service.InAppNotificationService;
import com.healthcare.clinic.security.SecurityUtils;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.healthcare.clinic.security.SseTicketService;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final InAppNotificationService notificationService;
    private final com.healthcare.clinic.notification.service.SseNotificationService sseNotificationService;
    private final SseTicketService sseTicketService;

    @PostMapping("/ticket")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> generateTicket(@AuthenticationPrincipal UserPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        String ticket = sseTicketService.generateTicket(user);
        return ResponseEntity.ok(Map.of("ticket", ticket));
    }

    @GetMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamNotifications(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(value = "ticket", required = false) String ticket) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        if (userId == null && StringUtils.hasText(ticket)) {
            SseTicketService.TicketDetails details = sseTicketService.consumeTicket(ticket);
            if (details != null && details.getUserId() != null) {
                userId = details.getUserId();
            }
        }
        if (userId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required for notification streaming");
        }
        return sseNotificationService.subscribe(userId);
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal user) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(notificationService.getForUser(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal user) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.ok(Map.of("count", 0L));
        }
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        if (userId != null) {
            notificationService.markRead(id, userId);
        }
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead(
            @AuthenticationPrincipal UserPrincipal user) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        if (userId != null) {
            notificationService.markAllRead(userId);
        }
        return ResponseEntity.noContent().build();
    }
}
