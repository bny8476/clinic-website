package com.healthcare.clinic.homevisit.service;

import com.healthcare.clinic.homevisit.entity.HomeVisitAssignment;
import com.healthcare.clinic.patient.entity.HomeVisitRequest;
import com.healthcare.clinic.homevisit.repository.HomeVisitAssignmentRepository;
import com.healthcare.clinic.homevisit.repository.HomeVisitRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HomeVisitDispatcherService {
    private final HomeVisitRequestRepository requestRepository;
    private final HomeVisitAssignmentRepository assignmentRepository;

    public HomeVisitRequest createRequest(HomeVisitRequest request) {
        request.setStatus("REQUESTED");
        return requestRepository.save(request);
    }

    public HomeVisitAssignment assignStaff(Long requestId, Long staffId, Long tenantId) {
        HomeVisitRequest request = requestRepository.findById(requestId).orElseThrow();
        request.setStatus("ASSIGNED");
        requestRepository.save(request);

        HomeVisitAssignment assignment = HomeVisitAssignment.builder()
            .request(request)
            .staffUserId(staffId)
            .tenantId(tenantId)
            .status("EN_ROUTE")
            .build();
        return assignmentRepository.save(assignment);
    }
    
    public List<HomeVisitRequest> getAllRequests() {
        return requestRepository.findAll();
    }
}
