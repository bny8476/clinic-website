package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.HomeVisitRequest;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.homevisit.repository.HomeVisitRequestRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HomeVisitService {

    private final HomeVisitRequestRepository homeVisitRequestRepository;
    private final PatientProfileRepository patientProfileRepository;

    private PatientProfile getPatientProfileForUser(User user) {
        return patientProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Patient profile not found for user"));
    }

    @Transactional
    public HomeVisitRequest requestHomeVisit(User user, HomeVisitRequest request) {
        PatientProfile profile = getPatientProfileForUser(user);
        
        request.setPatient(profile);
        request.setStatus("Requested");
        return homeVisitRequestRepository.save(request);
    }

    public List<HomeVisitRequest> getPatientRequests(User user) {
        PatientProfile profile = getPatientProfileForUser(user);
        return homeVisitRequestRepository.findByPatientIdOrderByCreatedAtDesc(profile.getId());
    }
    
    @Transactional
    public HomeVisitRequest cancelRequest(User user, Long requestId) {
        PatientProfile profile = getPatientProfileForUser(user);
        
        HomeVisitRequest request = homeVisitRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
                
        if (!request.getPatient().getId().equals(profile.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        if (!"Requested".equals(request.getStatus()) && !"Reviewed".equals(request.getStatus())) {
            throw new RuntimeException("Cannot cancel a request that is already " + request.getStatus());
        }
        
        request.setStatus("Cancelled");
        return homeVisitRequestRepository.save(request);
    }
}
