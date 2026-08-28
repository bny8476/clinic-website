package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.patient.entity.*;
import com.healthcare.clinic.patient.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientSettingsService {

    private final PatientProfileRepository patientProfileRepository;
    private final DependentProfileRepository dependentProfileRepository;
    private final EmergencyContactRepository emergencyContactRepository;
    private final PatientNotificationPreferenceRepository notificationPreferenceRepository;
    private final PatientConsentRepository consentRepository;
    private final ConsentVersionRepository consentVersionRepository;

    private PatientProfile getPatientProfileForUser(Long userId) {
        return patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found for userId: " + userId));
    }

    // --- Dependents ---
    @Transactional(readOnly = true)
    public List<DependentProfile> getDependents(Long userId) {
        PatientProfile guardian = getPatientProfileForUser(userId);
        return dependentProfileRepository.findByGuardianId(guardian.getId());
    }

    @Transactional
    public DependentProfile addDependent(Long userId, DependentProfile dependent) {
        PatientProfile guardian = getPatientProfileForUser(userId);
        dependent.setGuardian(guardian);
        return dependentProfileRepository.save(dependent);
    }

    @Transactional
    public void removeDependent(Long userId, Long dependentId) {
        PatientProfile guardian = getPatientProfileForUser(userId);
        DependentProfile dependent = dependentProfileRepository.findById(dependentId)
                .orElseThrow(() -> new IllegalArgumentException("Dependent not found"));
        if (!dependent.getGuardian().getId().equals(guardian.getId())) {
            throw new SecurityException("Unauthorized access to dependent profile");
        }
        dependentProfileRepository.delete(dependent);
    }

    // --- Emergency Contacts ---
    @Transactional(readOnly = true)
    public List<EmergencyContact> getEmergencyContacts(Long userId) {
        PatientProfile patient = getPatientProfileForUser(userId);
        return emergencyContactRepository.findByPatientId(patient.getId());
    }

    @Transactional
    public EmergencyContact addEmergencyContact(Long userId, EmergencyContact contact) {
        PatientProfile patient = getPatientProfileForUser(userId);
        contact.setPatient(patient);
        return emergencyContactRepository.save(contact);
    }
    
    @Transactional
    public void removeEmergencyContact(Long userId, Long contactId) {
        PatientProfile patient = getPatientProfileForUser(userId);
        EmergencyContact contact = emergencyContactRepository.findById(contactId)
                .orElseThrow(() -> new IllegalArgumentException("Contact not found"));
        if (!contact.getPatient().getId().equals(patient.getId())) {
            throw new SecurityException("Unauthorized access to emergency contact");
        }
        emergencyContactRepository.delete(contact);
    }

    // --- Notification Preferences ---
    @Transactional(readOnly = true)
    public List<PatientNotificationPreference> getNotificationPreferences(Long userId) {
        PatientProfile patient = getPatientProfileForUser(userId);
        return notificationPreferenceRepository.findByPatientId(patient.getId());
    }

    @Transactional
    public PatientNotificationPreference updateNotificationPreference(Long userId, String category, PatientNotificationPreference pref) {
        PatientProfile patient = getPatientProfileForUser(userId);
        PatientNotificationPreference existing = notificationPreferenceRepository.findByPatientIdAndCategory(patient.getId(), category)
                .orElseGet(() -> {
                    PatientNotificationPreference newPref = new PatientNotificationPreference();
                    newPref.setPatient(patient);
                    newPref.setCategory(category);
                    return newPref;
                });

        existing.setEmailEnabled(pref.getEmailEnabled());
        existing.setSmsEnabled(pref.getSmsEnabled());
        existing.setPushEnabled(pref.getPushEnabled());
        existing.setInAppEnabled(pref.getInAppEnabled());
        return notificationPreferenceRepository.save(existing);
    }

    // --- Consents ---
    @Transactional(readOnly = true)
    public List<ConsentVersion> getLatestConsentVersions() {
        return consentVersionRepository.findAll().stream().filter(ConsentVersion::getIsLatest).toList();
    }

    @Transactional(readOnly = true)
    public List<PatientConsent> getPatientConsents(Long userId) {
        PatientProfile patient = getPatientProfileForUser(userId);
        return consentRepository.findByPatientId(patient.getId());
    }

    @Transactional
    public PatientConsent grantConsent(Long userId, String consentType, String ipAddress, String userAgent) {
        PatientProfile patient = getPatientProfileForUser(userId);
        ConsentVersion latestVersion = consentVersionRepository.findByConsentTypeAndIsLatestTrue(consentType)
                .orElseThrow(() -> new IllegalArgumentException("No active consent version found for type: " + consentType));

        PatientConsent existing = consentRepository.findByPatientIdAndConsentVersionId(patient.getId(), latestVersion.getId())
                .orElseGet(() -> {
                    PatientConsent newConsent = new PatientConsent();
                    newConsent.setPatient(patient);
                    newConsent.setConsentVersion(latestVersion);
                    return newConsent;
                });

        existing.setIsGranted(true);
        existing.setIpAddress(ipAddress);
        existing.setUserAgent(userAgent);
        return consentRepository.save(existing);
    }

    @Transactional
    public void revokeConsent(Long userId, String consentType) {
        PatientProfile patient = getPatientProfileForUser(userId);
        ConsentVersion latestVersion = consentVersionRepository.findByConsentTypeAndIsLatestTrue(consentType)
                .orElseThrow(() -> new IllegalArgumentException("No active consent version found for type: " + consentType));

        consentRepository.findByPatientIdAndConsentVersionId(patient.getId(), latestVersion.getId()).ifPresent(c -> {
            c.setIsGranted(false);
            consentRepository.save(c);
        });
    }
}
