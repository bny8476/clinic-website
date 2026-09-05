package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.TeleconsultationRequest;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.TeleconsultationRequestRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeleconsultationService {

    private final TeleconsultationRequestRepository teleconsultationRequestRepository;
    private final PatientProfileRepository patientProfileRepository;

    private PatientProfile getPatientProfileForUser(User user) {
        return patientProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Patient profile not found for user"));
    }

    @Transactional
    public TeleconsultationRequest requestTeleconsultation(User user, TeleconsultationRequest request) {
        PatientProfile profile = getPatientProfileForUser(user);
        
        request.setPatientId(profile.getId());
        request.setStatus("Requested");
        
        // Save request first to generate actual database primary key ID
        TeleconsultationRequest saved = teleconsultationRequestRepository.save(request);
        saved.setJoinLink("/teleconsultation/room/session-" + saved.getId());
        return teleconsultationRequestRepository.save(saved);
    }

    public List<TeleconsultationRequest> getPatientRequestsForUserId(Long userId) {
        if (userId == null) return List.of();
        PatientProfile profile = patientProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) return List.of();
        return teleconsultationRequestRepository.findByPatientIdOrderByCreatedAtDesc(profile.getId());
    }

    @Transactional
    public TeleconsultationRequest requestTeleconsultationForUserId(Long userId, TeleconsultationRequest request) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));
        request.setPatientId(profile.getId());
        request.setStatus("Requested");
        
        // Save request first to generate actual database primary key ID
        TeleconsultationRequest saved = teleconsultationRequestRepository.save(request);
        saved.setJoinLink("/teleconsultation/room/session-" + saved.getId());
        return teleconsultationRequestRepository.save(saved);
    }

    @Transactional
    public TeleconsultationRequest linkEncounterToTeleconsultation(Long requestId, Long encounterId) {
        TeleconsultationRequest request = teleconsultationRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Teleconsultation request not found"));
        request.setJoinLink("/teleconsultation/room/" + encounterId);
        return teleconsultationRequestRepository.save(request);
    }

    @Transactional
    public TeleconsultationRequest cancelRequestForUserId(Long userId, Long requestId) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));
        TeleconsultationRequest request = teleconsultationRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (!request.getPatientId().equals(profile.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        if (!"Requested".equals(request.getStatus())) {
            throw new RuntimeException("Cannot cancel a request that is already " + request.getStatus());
        }
        request.setStatus("Cancelled");
        return teleconsultationRequestRepository.save(request);
    }

    public List<TeleconsultationRequest> getPatientRequests(User user) {
        if (user == null) return List.of();
        return getPatientRequestsForUserId(user.getId());
    }
    
    @Transactional
    public TeleconsultationRequest cancelRequest(User user, Long requestId) {
        PatientProfile profile = getPatientProfileForUser(user);
        
        TeleconsultationRequest request = teleconsultationRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
                
        if (!request.getPatientId().equals(profile.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        if (!"Requested".equals(request.getStatus())) {
            throw new RuntimeException("Cannot cancel a request that is already " + request.getStatus());
        }
        
        request.setStatus("Cancelled");
        return teleconsultationRequestRepository.save(request);
    }
}
