package com.healthcare.clinic.laboratory.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.laboratory.entity.LabResult;
import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import com.healthcare.clinic.laboratory.repository.LabResultRepository;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;
import com.healthcare.clinic.notification.event.LabResultReleasedEvent;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class LabReportVerificationService {

    private final LabResultRepository resultRepository;
    private final LabTestRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public LabResult verifyReport(Long requestId, UserPrincipal pathologistPrincipal, String comments) {
        log.info("Pathologist {} is verifying lab request {}", pathologistPrincipal != null ? pathologistPrincipal.getUsername() : "unknown", requestId);

        LabTestRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lab request not found"));

        if (!"PENDING_VERIFICATION".equals(request.getStatus())) {
            throw new IllegalStateException("Request is not pending verification");
        }

        LabResult result = resultRepository.findByRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lab result not found for this request"));

        User pathologist = pathologistPrincipal != null && pathologistPrincipal.getUserId() != null
                ? userRepository.findById(pathologistPrincipal.getUserId()).orElse(null)
                : null;

        result.setVerifiedBy(pathologist);
        result.setVerifiedAt(ZonedDateTime.now());
        result.setPathologistComments(comments);
        result = resultRepository.save(result);

        request.setStatus("VERIFIED");
        request.setReleasedAt(ZonedDateTime.now());
        requestRepository.save(request);

        // Publish event for notifications and timeline updates
        User patientUser = userRepository.findById(request.getPatient().getUserId()).orElse(null);
        
        LabResultReleasedEvent event = LabResultReleasedEvent.builder()
                .requestId(request.getId())
                .patientId(request.getPatient().getId())
                .patientEmail(patientUser != null ? patientUser.getEmail() : null)
                .patientName(patientUser != null ? patientUser.getFirstName() + " " + patientUser.getLastName() : null)
                .testName(request.getTestCatalog().getTestName())
                .doctorId(request.getDoctor() != null ? request.getDoctor().getId() : null)
                .build();
        eventPublisher.publishEvent(event);

        return result;
    }
}
