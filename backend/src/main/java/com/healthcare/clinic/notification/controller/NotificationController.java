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

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final InAppNotificationService notificationService;

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
