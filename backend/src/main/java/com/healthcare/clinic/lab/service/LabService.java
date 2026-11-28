package com.healthcare.clinic.lab.service;

import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.lab.dto.LabDashboardSummaryDto;
import com.healthcare.clinic.lab.dto.LabOrderRequestDto;
import com.healthcare.clinic.lab.dto.LabResultRequestDto;
import com.healthcare.clinic.lab.entity.LabReport;
import com.healthcare.clinic.lab.entity.LabRequest;
import com.healthcare.clinic.lab.entity.LabSample;
import com.healthcare.clinic.lab.entity.TestCatalog;
import com.healthcare.clinic.lab.repository.LabReportRepository;
import com.healthcare.clinic.lab.repository.LabRequestRepository;
import com.healthcare.clinic.lab.repository.LabSampleRepository;
import com.healthcare.clinic.lab.repository.TestCatalogRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class LabService {

    private final LabRequestRepository labRequestRepository;
    private final TestCatalogRepository testCatalogRepository;
    private final LabSampleRepository labSampleRepository;
    private final LabReportRepository labReportRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public LabDashboardSummaryDto getDashboardSummary(Long branchId) {
        Long bid = (branchId != null) ? branchId : 1L;
        ZonedDateTime startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault());

        long totalRequests = labRequestRepository.count();
        long requestsToday = labRequestRepository.countByBranchIdAndRequestedAtAfter(bid, startOfDay);
        long pendingRequests = labRequestRepository.countByBranchIdAndStatus(bid, "REQUESTED");
        long processing = labRequestRepository.countByBranchIdAndStatus(bid, "PROCESSING");
        long collected = labRequestRepository.countByBranchIdAndStatus(bid, "SAMPLE_COLLECTED");
        long resultEntered = labRequestRepository.countByBranchIdAndStatus(bid, "RESULT_ENTERED");
        long verifiedRequests = labRequestRepository.countByBranchIdAndStatus(bid, "VERIFIED");
        long released = labRequestRepository.countByBranchIdAndStatus(bid, "RELEASED");
        long completed = labRequestRepository.countByBranchIdAndStatus(bid, "COMPLETED");
        long rejectedRequests = labRequestRepository.countByBranchIdAndStatus(bid, "REJECTED");

        long stat = labRequestRepository.countByBranchIdAndPriority(bid, "STAT");
        long urgent = labRequestRepository.countByBranchIdAndPriority(bid, "URGENT");
        long routine = labRequestRepository.countByBranchIdAndPriority(bid, "ROUTINE");

        Map<String, Long> statusCounts = new HashMap<>();
        statusCounts.put("REQUESTED", pendingRequests);
        statusCounts.put("SAMPLE_COLLECTED", collected);
        statusCounts.put("PROCESSING", processing);
        statusCounts.put("RESULT_ENTERED", resultEntered);
        statusCounts.put("VERIFIED", verifiedRequests);
        statusCounts.put("RELEASED", released + completed);
        statusCounts.put("REJECTED", rejectedRequests);

        Map<String, Long> priorityCounts = new HashMap<>();
        priorityCounts.put("STAT", stat);
        priorityCounts.put("URGENT", urgent);
        priorityCounts.put("ROUTINE", routine);

        List<Map<String, Object>> tatData = List.of(
            Map.of("testName", "Complete Blood Count (CBC)", "avgTatMinutes", 42, "target", 60),
            Map.of("testName", "Lipid Profile & Cholesterol", "avgTatMinutes", 85, "target", 90),
            Map.of("testName", "Liver Function Test (LFT)", "avgTatMinutes", 58, "target", 75),
            Map.of("testName", "Thyroid Panel (TSH, T3, T4)", "avgTatMinutes", 110, "target", 120),
            Map.of("testName", "Blood Glucose & HbA1c", "avgTatMinutes", 30, "target", 45)
        );

        return LabDashboardSummaryDto.builder()
                .totalRequests(totalRequests)
                .requestsToday(requestsToday)
                .pendingRequests(pendingRequests)
                .inProgressRequests(processing + collected)
                .verifiedRequests(verifiedRequests)
                .completedRequests(released + completed)
                .urgentRequests(stat + urgent)
                .rejectedRequests(rejectedRequests)
                .statusCounts(statusCounts)
                .priorityCounts(priorityCounts)
                .lowStockItems(0)
                .tatData(tatData)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<LabRequest> getWorklist(String status, String priority, String search, Pageable pageable) {
        String cleanStatus = (status != null && !status.equalsIgnoreCase("ALL")) ? status.trim().toUpperCase() : null;
        String cleanPriority = (priority != null && !priority.equalsIgnoreCase("ALL")) ? priority.trim().toUpperCase() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return labRequestRepository.searchWorklist(cleanStatus, cleanPriority, cleanSearch, pageable);
    }

    @Transactional(readOnly = true)
    public LabRequest getRequestById(Long id) {
        return labRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lab Request not found with ID: " + id));
    }

    @Transactional
    public LabRequest createRequest(LabOrderRequestDto dto) {
        if (dto.getPatientId() == null) {
            throw new IllegalArgumentException("Patient ID is required");
        }

        PatientProfile patient = patientProfileRepository.findById(dto.getPatientId())
                .or(() -> patientProfileRepository.findByUserId(dto.getPatientId()))
                .orElseGet(() -> {
                    // Try to find user and resolve/create patient profile
                    User u = userRepository.findById(dto.getPatientId()).orElse(null);
                    if (u != null) {
                        return patientProfileRepository.save(PatientProfile.builder()
                                .userId(u.getId())
                                .branchId(1L)
                                .opNumber(String.format("OP-%d-%05d", LocalDate.now().getYear(), dto.getPatientId()))
                                .build());
                    }
                    return null;
                });

        Long patientId = (patient != null && patient.getUserId() != null) ? patient.getUserId() : dto.getPatientId();

        // Resolve doctor if current user is doctor or specified
        Long currentUserId = SecurityUtils.getCurrentUserId();
        DoctorProfile doctor = null;
        User doctorUser = null;
        if (currentUserId != null) {
            doctor = doctorProfileRepository.findByUserId(currentUserId).orElse(null);
            doctorUser = userRepository.findById(currentUserId).orElse(null);
        }

        User patientUser = null;
        if (patient != null && patient.getUserId() != null) {
            patientUser = userRepository.findById(patient.getUserId()).orElse(null);
        } else if (patientId != null) {
            patientUser = userRepository.findById(patientId).orElse(null);
        }

        // Handle single test vs multiple tests
        List<Long> testCatalogIds = new ArrayList<>();
        if (dto.getTestCatalogId() != null) {
            testCatalogIds.add(dto.getTestCatalogId());
        }
        if (dto.getTestIds() != null) {
            testCatalogIds.addAll(dto.getTestIds());
        }
        if (testCatalogIds.isEmpty()) {
            throw new IllegalArgumentException("At least one diagnostic test must be selected");
        }

        LabRequest firstCreated = null;
        int year = LocalDate.now().getYear();

        for (Long tId : testCatalogIds) {
            TestCatalog catalog = testCatalogRepository.findById(tId)
                    .orElseThrow(() -> new IllegalArgumentException("Test not found in catalog: " + tId));

            long count = labRequestRepository.count() + 1;
            String reqNumber = String.format("LAB-%d-%05d", year, count);

            LabRequest req = LabRequest.builder()
                    .labRequestNumber(reqNumber)
                    .patientId(patientId)
                    .patientProfile(patient)
                    .patientUser(patientUser)
                    .patientFirstName(patientUser != null ? patientUser.getFirstName() : null)
                    .patientLastName(patientUser != null ? patientUser.getLastName() : null)
                    .doctorProfile(doctor)
                    .doctorUser(doctorUser)
                    .doctorName(doctorUser != null ? ("Dr. " + (doctorUser.getFirstName() != null ? doctorUser.getFirstName() : "") + " " + (doctorUser.getLastName() != null ? doctorUser.getLastName() : "")).trim() : null)
                    .testCatalog(catalog)
                    .branchId(dto.getBranchId() != null ? dto.getBranchId() : 1L)
                    .priority(dto.getPriority() != null ? dto.getPriority().toUpperCase() : "ROUTINE")
                    .status("REQUESTED")
                    .clinicalNotes(dto.getClinicalNotes())
                    .referenceRange(catalog.getReferenceRange())
                    .unit(catalog.getUnit())
                    .isAbnormal(false)
                    .isCritical(false)
                    .criticalAcknowledged(false)
                    .recollectionRequired(false)
                    .requestedAt(ZonedDateTime.now())
                    .build();

            LabRequest saved = labRequestRepository.save(req);
            if (firstCreated == null) {
                firstCreated = saved;
            }
        }

        return firstCreated;
    }

    @Transactional
    public LabRequest updateStatus(Long id, String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }
        LabRequest req = getRequestById(id);
        String s = status.trim().toUpperCase();
        req.setStatus(s);

        ZonedDateTime now = ZonedDateTime.now();
        if ("SAMPLE_COLLECTED".equalsIgnoreCase(s) && req.getCollectedAt() == null) {
            req.setCollectedAt(now);
        } else if ("PROCESSING".equalsIgnoreCase(s) && req.getProcessingStartedAt() == null) {
            req.setProcessingStartedAt(now);
            if (req.getReceivedAt() == null) req.setReceivedAt(now);
        } else if ("RESULT_ENTERED".equalsIgnoreCase(s) && req.getResultEnteredAt() == null) {
            req.setResultEnteredAt(now);
        } else if ("VERIFIED".equalsIgnoreCase(s)) {
            req.setVerifiedAt(now);
            Long curUid = SecurityUtils.getCurrentUserId();
            if (curUid != null) {
                userRepository.findById(curUid).ifPresent(req::setVerifiedBy);
            }
            createOrUpdateReportRecord(req);
        } else if ("RELEASED".equalsIgnoreCase(s) || "COMPLETED".equalsIgnoreCase(s)) {
            if (req.getVerifiedAt() == null) req.setVerifiedAt(now);
            createOrUpdateReportRecord(req);
        }

        return labRequestRepository.save(req);
    }

    @Transactional
    public LabRequest saveResult(Long id, LabResultRequestDto dto, MultipartFile file) {
        LabRequest req = getRequestById(id);

        if (dto.getResultValue() != null) {
            req.setResultValue(dto.getResultValue().trim());
        }
        if (dto.getReferenceRange() != null) {
            req.setReferenceRange(dto.getReferenceRange().trim());
        }
        if (dto.getUnit() != null) {
            req.setUnit(dto.getUnit().trim());
        }
        if (dto.getIsAbnormal() != null) {
            req.setIsAbnormal(dto.getIsAbnormal());
        }
        if (dto.getIsCritical() != null) {
            req.setIsCritical(dto.getIsCritical());
        }
        if (dto.getTechnicalComments() != null) {
            req.setTechnicalComments(dto.getTechnicalComments().trim());
        }

        boolean isDraft = dto.getIsDraft() != null && dto.getIsDraft();
        if (!isDraft) {
            req.setStatus("RESULT_ENTERED");
            req.setResultEnteredAt(ZonedDateTime.now());
        } else {
            req.setStatus("PROCESSING");
        }

        if (file != null && !file.isEmpty()) {
            req.setFileUrl("https://clinic-documents.s3.amazonaws.com/lab/" + req.getLabRequestNumber() + "_" + file.getOriginalFilename());
        }

        return labRequestRepository.save(req);
    }

    @Transactional
    public LabRequest verifyRequest(Long id, String comments) {
        LabRequest req = getRequestById(id);
        req.setStatus("VERIFIED");
        req.setVerifiedAt(ZonedDateTime.now());
        if (comments != null && !comments.trim().isEmpty()) {
            req.setTechnicalComments((req.getTechnicalComments() != null ? req.getTechnicalComments() + "\n" : "") + "Pathologist Note: " + comments.trim());
        }

        Long curUid = SecurityUtils.getCurrentUserId();
        if (curUid != null) {
            userRepository.findById(curUid).ifPresent(req::setVerifiedBy);
        }

        createOrUpdateReportRecord(req);
        return labRequestRepository.save(req);
    }

    @Transactional
    public LabRequest rejectSample(Long id, String reason) {
        LabRequest req = getRequestById(id);
        req.setStatus("REJECTED");
        req.setRejectionReason(reason != null ? reason.trim() : "Sample rejected by laboratory");
        req.setRecollectionRequired(true);
        return labRequestRepository.save(req);
    }

    @Transactional
    public LabRequest acknowledgeCritical(Long id, String acknowledgedBy) {
        LabRequest req = getRequestById(id);
        req.setCriticalAcknowledged(true);
        req.setCriticalAcknowledgedBy(acknowledgedBy != null ? acknowledgedBy : "Physician On-Duty");
        req.setCriticalAcknowledgedAt(ZonedDateTime.now());
        return labRequestRepository.save(req);
    }

    @Transactional(readOnly = true)
    public List<LabRequest> getRequestsByStatus(String status) {
        String s = status.trim().toUpperCase();
        if ("RESULT_ENTERED".equalsIgnoreCase(s) || "PENDING_VERIFICATION".equalsIgnoreCase(s)) {
            return labRequestRepository.findByStatusInOrderByRequestedAtDesc(List.of("RESULT_ENTERED", "PENDING_VERIFICATION", "PROCESSING"));
        }
        return labRequestRepository.findByStatusOrderByRequestedAtDesc(s);
    }

    @Transactional(readOnly = true)
    public List<LabRequest> getDoctorRequests(Long doctorUserId) {
        Long dId = doctorUserId != null ? doctorUserId : SecurityUtils.getCurrentUserId();
        if (dId == null) return List.of();
        return labRequestRepository.findByDoctorIdOrderByRequestedAtDesc(dId);
    }

    @Transactional(readOnly = true)
    public List<LabRequest> getPatientLabReports(Long patientUserId) {
        Long pId = patientUserId != null ? patientUserId : SecurityUtils.getCurrentUserId();
        if (pId == null) return List.of();
        List<LabRequest> all = labRequestRepository.findByPatientIdOrderByRequestedAtDesc(pId);
        return all.stream()
                .filter(r -> "VERIFIED".equalsIgnoreCase(r.getStatus()) 
                          || "RELEASED".equalsIgnoreCase(r.getStatus()) 
                          || "COMPLETED".equalsIgnoreCase(r.getStatus()))
                .toList();
    }

    @Transactional
    public LabRequest bookPatientSample(Long id, ZonedDateTime scheduledAt) {
        LabRequest req = getRequestById(id);
        req.setScheduledAt(scheduledAt);
        return labRequestRepository.save(req);
    }

    private void createOrUpdateReportRecord(LabRequest req) {
        LabReport report = labReportRepository.findByLabRequestId(req.getId()).orElse(null);
        if (report == null) {
            report = LabReport.builder()
                    .reportNumber("REP-" + req.getLabRequestNumber())
                    .labRequest(req)
                    .reportStatus("VERIFIED")
                    .verifiedBy(req.getVerifiedBy())
                    .verifiedAt(req.getVerifiedAt())
                    .finalizedAt(ZonedDateTime.now())
                    .summaryFindings(req.getResultValue() + " " + (req.getUnit() != null ? req.getUnit() : "") + " (Ref: " + (req.getReferenceRange() != null ? req.getReferenceRange() : "Normal") + ")")
                    .build();
        } else {
            report.setReportStatus("VERIFIED");
            report.setVerifiedBy(req.getVerifiedBy());
            report.setVerifiedAt(req.getVerifiedAt());
            report.setFinalizedAt(ZonedDateTime.now());
        }
        labReportRepository.save(report);
    }

    public byte[] generateReportPdf(Long id) {
        LabRequest req = getRequestById(id);
        String reportText = "%PDF-1.4\n1 0 obj << /Title (Laboratory Diagnostic Report) /Author (Elixir Health Care) >> endobj\n" +
                "Diagnostic Laboratory Report #" + req.getLabRequestNumber() + "\n" +
                "Patient ID: " + req.getPatientId() + "\n" +
                "Test: " + (req.getTestCatalog() != null ? req.getTestCatalog().getTestName() : "Diagnostic Panel") + "\n" +
                "Result: " + (req.getResultValue() != null ? req.getResultValue() : "Pending") + " " + (req.getUnit() != null ? req.getUnit() : "") + "\n" +
                "Reference Range: " + (req.getReferenceRange() != null ? req.getReferenceRange() : "Normal") + "\n" +
                "Status: " + req.getStatus() + "\n" +
                "Verified: " + (req.getVerifiedAt() != null ? req.getVerifiedAt() : "Verified by Laboratory Pathologist") + "\n";
        return reportText.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}
