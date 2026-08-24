package com.healthcare.clinic.notification.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.notification.entity.Notification;
import com.healthcare.clinic.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class InAppNotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Notification sendToUser(Long userId, String title, String body, String type, Long referenceId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .body(body)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .build();
        log.info("Sending in-app notification [{}] to user {}: {}", type, userId, title);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void sendToRole(String roleName, String title, String body, String type, Long referenceId) {
        List<User> users = userRepository.findUsersByRoleName(roleName);
        for (User user : users) {
            sendToUser(user.getId(), title, body, type, referenceId);
        }
        log.info("Broadcast in-app notification [{}] to {} users with role {}", type, users.size(), roleName);
    }

    @Transactional(readOnly = true)
    public List<Notification> getForUser(Long userId) {
        return notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadForUser(userId);
    }
}
