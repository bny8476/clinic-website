package com.healthcare.clinic.laboratory.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.laboratory.entity.LabResult;
import com.healthcare.clinic.laboratory.entity.LabTestCatalog;
import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import com.healthcare.clinic.laboratory.repository.LabResultRepository;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;
import com.healthcare.clinic.notification.service.InAppNotificationService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class LabResultService {

    private final LabResultRepository resultRepository;
    private final LabTestRequestRepository requestRepository;
    private final InAppNotificationService inAppNotificationService;
    private final LabOperationalService labOperationalService;
    private final UserRepository userRepository;

    @Transactional
    public LabResult addResult(Long requestId, LabResult result, UserPrincipal labTechPrincipal) {
        LabTestRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (!"IN_PROGRESS".equals(request.getStatus())) {
            throw new IllegalStateException("Test must be in IN_PROGRESS status to enter results");
        }

        LabResult existingResult = resultRepository.findByRequestId(requestId).orElse(null);
        if (existingResult != null) {
            result.setId(existingResult.getId());
            result.setEnteredAt(existingResult.getEnteredAt()); // Preserve original entry time
        } else {
            result.setEnteredAt(ZonedDateTime.now());
        }

        User labTech = labTechPrincipal != null && labTechPrincipal.getUserId() != null
                ? userRepository.findById(labTechPrincipal.getUserId()).orElse(null)
                : null;

        result.setRequest(request);
        result.setLabTech(labTech);

        LabTestCatalog catalog = request.getTestCatalog();
        if (catalog != null) {
            labOperationalService.validateQcPassed(catalog.getId());

            if (result.getReferenceRange() == null) {
                result.setReferenceRange(catalog.getReferenceRange());
            }
            if (result.getUnit() == null) {
                result.setUnit(catalog.getUnit());
            }

            // Normalcy validation
            validateResult(result);
        }

        LabResult savedResult = resultRepository.save(result);

        // Update Request Status if not a draft
        if (!Boolean.TRUE.equals(result.getIsDraft())) {
            request.setStatus("PENDING_VERIFICATION");
            requestRepository.save(request);
        }

        // Notify if Critical
        if (Boolean.TRUE.equals(result.getIsCritical())) {
            notifyCriticalResult(request, result);
        }

        return savedResult;
    }

    private void validateResult(LabResult result) {
        String range = result.getReferenceRange();
        String valueStr = result.getResultValue();

        if (range == null || range.trim().isEmpty() || valueStr == null || valueStr.trim().isEmpty()) {
            return;
        }

        try {
            double value = Double.parseDouble(valueStr.trim());
            
            // Regex to match ranges like "70-99", "70.5 - 99.5"
            Pattern rangePattern = Pattern.compile("^([0-9.]+)\\s*-\\s*([0-9.]+)$");
            Matcher m = rangePattern.matcher(range.trim());
            
            if (m.matches()) {
                double min = Double.parseDouble(m.group(1));
                double max = Double.parseDouble(m.group(2));
                
                boolean abnormal = false;
                boolean critical = false;
                
                if (value < min || value > max) {
                    abnormal = true;
                    // 20% deviation is critical
                    double rangeDiff = max - min;
                    double criticalDeviation = rangeDiff * 0.2;
                    if (value < (min - criticalDeviation) || value > (max + criticalDeviation)) {
                        critical = true;
                    }
                }
                
                result.setIsAbnormal(abnormal);
                result.setIsCritical(critical);
            } else if (range.trim().startsWith("<")) {
                double max = Double.parseDouble(range.replace("<", "").trim());
                if (value >= max) {
                    result.setIsAbnormal(true);
                    if (value >= max * 1.2) result.setIsCritical(true);
                } else {
                    result.setIsAbnormal(false);
                    result.setIsCritical(false);
                }
            } else if (range.trim().startsWith(">")) {
                double min = Double.parseDouble(range.replace(">", "").trim());
                if (value <= min) {
                    result.setIsAbnormal(true);
                    if (value <= min * 0.8) result.setIsCritical(true);
                } else {
                    result.setIsAbnormal(false);
                    result.setIsCritical(false);
                }
            }

        } catch (NumberFormatException e) {
            // Not a numeric value, cannot parse for normalcy
            log.debug("Result value is not numeric, skipping normalcy validation: {}", valueStr);
        }
    }

    private void notifyCriticalResult(LabTestRequest request, LabResult result) {
        log.warn("Critical lab result detected for Request ID: {}", request.getId());
        
        // Notify the doctor
        if (request.getDoctor() != null && request.getDoctor().getUserId() != null) {
            String message = String.format("CRITICAL RESULT for %s: %s %s (Range: %s)", 
                    request.getTestCatalog().getTestName(), 
                    result.getResultValue(), 
                    result.getUnit() != null ? result.getUnit() : "", 
                    result.getReferenceRange());
                    
            inAppNotificationService.sendToUser(request.getDoctor().getUserId(),
                    "Critical Lab Result",
                    message,
                    "LAB_RESULT_CRITICAL",
                    request.getId());
        }
        
        // Notify the lab manager/admin
        inAppNotificationService.sendToRole("ROLE_ADMIN",
                "Critical Lab Result",
                "Critical result entered for test " + request.getTestCatalog().getTestName() + " (Request #" + request.getLabRequestNumber() + ")",
                "LAB_RESULT_CRITICAL",
                request.getId());
    }

    @Transactional
    public LabTestRequest acknowledgeLabOrder(Long requestId, Long doctorId) {
        LabTestRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        
        com.healthcare.clinic.identity.entity.User doctor = new com.healthcare.clinic.identity.entity.User();
        doctor.setId(doctorId);
        
        request.setAcknowledgedBy(doctor);
        request.setAcknowledgedAt(ZonedDateTime.now());
        
        return requestRepository.save(request);
    }
}
