package com.healthcare.clinic.laboratory.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import com.healthcare.clinic.laboratory.entity.RejectionReason;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class LabSampleLifecycleService {

    private final LabTestRequestRepository requestRepository;

    @Transactional
    public LabTestRequest acceptRequest(Long requestId, User user) {
        LabTestRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lab request not found"));

        if (!"REQUESTED".equals(request.getStatus())) {
            throw new IllegalStateException("Can only accept requests in REQUESTED status");
        }

        request.setStatus("ACCEPTED");
        request.setAcceptedBy(user);
        request.setAcceptedAt(ZonedDateTime.now());
        return requestRepository.save(request);
    }

    @Transactional
    public LabTestRequest rejectRequest(Long requestId, RejectionReason reason, String notes, User user) {
        LabTestRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lab request not found"));

        if ("VERIFIED".equals(request.getStatus()) || "REJECTED".equals(request.getStatus())) {
            throw new IllegalStateException("Cannot reject a request that is already VERIFIED or REJECTED");
        }

        request.setStatus("REJECTED");
        request.setRejectionReason(reason);
        request.setRejectionNotes(notes);
        request.setRejectedAt(ZonedDateTime.now());
        return requestRepository.save(request);
    }

    @Transactional
    public LabTestRequest collectSample(Long requestId, User user) {
        LabTestRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lab request not found"));

        if (!"ACCEPTED".equals(request.getStatus())) {
            throw new IllegalStateException("Can only collect sample for ACCEPTED requests");
        }

        request.setStatus("SAMPLE_COLLECTED");
        request.setSampleCollectedAt(ZonedDateTime.now());
        return requestRepository.save(request);
    }

    @Transactional
    public LabTestRequest startProcessing(Long requestId, User user) {
        LabTestRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lab request not found"));

        if (!"SAMPLE_COLLECTED".equals(request.getStatus())) {
            throw new IllegalStateException("Can only start processing for SAMPLE_COLLECTED requests");
        }

        request.setStatus("IN_PROGRESS");
        return requestRepository.save(request);
    }
}
