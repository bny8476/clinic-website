package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.patient.entity.PatientNotification;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientNotificationRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientNotificationService {

    private final PatientNotificationRepository notificationRepository;
    private final PatientProfileRepository patientProfileRepository;

    private PatientProfile getPatientProfile(UserPrincipal user) {
        return patientProfileRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Patient profile not found for user"));
    }

    public List<PatientNotification> getNotifications(UserPrincipal user) {
        PatientProfile profile = getPatientProfile(user);
        return notificationRepository.findByPatientIdOrderByCreatedAtDesc(profile.getId());
    }

    public List<PatientNotification> getUnreadNotifications(UserPrincipal user) {
        PatientProfile profile = getPatientProfile(user);
        return notificationRepository.findByPatientIdAndIsReadFalse(profile.getId());
    }

    @Transactional
    public void markAsRead(UserPrincipal user, Long notificationId) {
        PatientNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        PatientProfile profile = getPatientProfile(user);
        if (!notification.getPatientId().equals(profile.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        notification.setRead(true);
        notificationRepository.save(notification);
    }
}
