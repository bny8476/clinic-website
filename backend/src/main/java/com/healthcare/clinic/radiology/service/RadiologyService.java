package com.healthcare.clinic.radiology.service;

import com.healthcare.clinic.billing.dto.InvoiceItemRequest;
import com.healthcare.clinic.billing.dto.InvoiceRequest;
import com.healthcare.clinic.billing.dto.InvoiceResponse;
import com.healthcare.clinic.billing.entity.Invoice;
import com.healthcare.clinic.billing.entity.ItemType;
import com.healthcare.clinic.billing.repository.InvoiceRepository;
import com.healthcare.clinic.billing.service.BillingService;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.radiology.dto.DicomStudyMetadataDto;
import com.healthcare.clinic.radiology.dto.RadiologyDashboardDto;
import com.healthcare.clinic.radiology.entity.ImagingProcedure;
import com.healthcare.clinic.radiology.entity.ImagingRequest;
import com.healthcare.clinic.radiology.entity.RadiologyModality;
import com.healthcare.clinic.radiology.entity.RadiologyReport;
import com.healthcare.clinic.radiology.repository.ImagingProcedureRepository;
import com.healthcare.clinic.radiology.repository.ImagingRequestRepository;
import com.healthcare.clinic.radiology.repository.RadiologyModalityRepository;
import com.healthcare.clinic.radiology.repository.RadiologyReportRepository;
import com.healthcare.clinic.security.SecurityUtils;
import com.healthcare.clinic.security.UserPrincipal;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RadiologyService {

    private final ImagingProcedureRepository procedureRepository;
    private final RadiologyModalityRepository modalityRepository;
    private final ImagingRequestRepository requestRepository;
    private final RadiologyReportRepository reportRepository;
    private final BillingService billingService;
    private final InvoiceRepository invoiceRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    @Transactional(readOnly = true)
    public RadiologyDashboardDto getDashboardMetrics(Long branchId) {
        ZonedDateTime startOfToday = LocalDate.now().atStartOfDay(ZoneId.systemDefault());
        ZonedDateTime endOfToday = startOfToday.plusDays(1);

        long todayOrders = requestRepository.countByRequestedAtGreaterThanEqual(startOfToday);
        long todayAppointments = requestRepository.countByScheduledAtGreaterThanEqual(startOfToday);

        List<ImagingRequest> allRequests = requestRepository.findAllByOrderByRequestedAtDesc();

        long pendingOrders = 0;
        long waitingPatients = 0;
        long checkedInPatients = 0;
        long studiesPending = 0;
        long studiesInProgress = 0;
        long studiesCompleted = 0;
        long reportsPending = 0;
        long reportsAwaitingVerification = 0;
        long criticalFindings = 0;
        long cancelledAppointments = 0;
        long statUrgent = 0;

        Map<String, Long> statusCounts = new HashMap<>();
        Map<String, Long> modalityWorkload = new HashMap<>();
        Map<String, Long> priorityCounts = new HashMap<>();

        for (ImagingRequest req : allRequests) {
            String s = req.getStatus() != null ? req.getStatus().toUpperCase() : "ORDERED";
            statusCounts.put(s, statusCounts.getOrDefault(s, 0L) + 1);

            String mod = (req.getProcedure() != null && req.getProcedure().getModality() != null)
                    ? req.getProcedure().getModality().toUpperCase()
                    : "XRAY";
            modalityWorkload.put(mod, modalityWorkload.getOrDefault(mod, 0L) + 1);

            String p = req.getPriority() != null ? req.getPriority().toUpperCase() : "ROUTINE";
            priorityCounts.put(p, priorityCounts.getOrDefault(p, 0L) + 1);

            if ("STAT".equals(p) || "URGENT".equals(p)) {
                statUrgent++;
            }

            if (Boolean.TRUE.equals(req.getIsCritical())) {
                criticalFindings++;
            }

            if ("CANCELLED".equals(s)) {
                cancelledAppointments++;
            } else if ("ORDERED".equals(s) || "SCHEDULED".equals(s)) {
                pendingOrders++;
                studiesPending++;
            } else if ("CHECKED_IN".equals(s) || "PREPARATION".equals(s) || "IN_PROGRESS".equals(s) || "ACQUIRED".equals(s)) {
                pendingOrders++;
                studiesInProgress++;
                if ("CHECKED_IN".equals(s)) checkedInPatients++;
                if ("WAITING".equalsIgnoreCase(req.getQueueStatus()) || "CALLED".equalsIgnoreCase(req.getQueueStatus())) {
                    waitingPatients++;
                }
            } else if ("REPORTING".equals(s)) {
                pendingOrders++;
                reportsPending++;
            } else if ("VERIFIED".equals(s) || "FINALIZED".equals(s) || "RELEASED".equals(s) || "COMPLETED".equals(s)) {
                studiesCompleted++;
                if ("FINALIZED".equals(s)) reportsAwaitingVerification++;
            }
        }

        return RadiologyDashboardDto.builder()
                .todayOrders(todayOrders)
                .pendingOrders(pendingOrders)
                .todayAppointments(todayAppointments)
                .waitingPatients(waitingPatients)
                .checkedInPatients(checkedInPatients)
                .studiesPending(studiesPending)
                .studiesInProgress(studiesInProgress)
                .studiesCompleted(studiesCompleted)
                .reportsPending(reportsPending)
                .reportsAwaitingVerification(reportsAwaitingVerification)
                .criticalFindings(criticalFindings)
                .cancelledAppointments(cancelledAppointments)
                .cancelledOrRejected(cancelledAppointments)
                .statOrUrgentCount(statUrgent)
                .totalVolume(allRequests.size())
                .statusCounts(statusCounts)
                .modalityWorkload(modalityWorkload)
                .priorityCounts(priorityCounts)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ImagingProcedure> getProcedures() {
        return procedureRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public List<RadiologyModality> getModalities() {
        return modalityRepository.findByIsActiveTrueOrderByModalityTypeAsc();
    }

    @Transactional
    public ImagingProcedure createProcedure(ImagingProcedure procedure) {
        return procedureRepository.save(procedure);
    }

    @Transactional
    public List<ImagingRequest> getAllRequests() {
        List<ImagingRequest> requests = requestRepository.findAllByOrderByRequestedAtDesc();
        if (requests.isEmpty()) {
            seedDemonstrationDataIfEmpty();
            requests = requestRepository.findAllByOrderByRequestedAtDesc();
        }
        return requests;
    }

    @Transactional(readOnly = true)
    public ImagingRequest getRequestById(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Imaging Request not found with ID: " + id));
    }

    @Transactional
    public List<ImagingRequest> getRequestsByStatus(String status) {
        String s = status.trim().toUpperCase();
        if ("RELEASED".equals(s) || "COMPLETED".equals(s)) {
            return requestRepository.findByStatusInOrderByRequestedAtDesc(List.of("RELEASED", "COMPLETED", "VERIFIED"));
        }
        return requestRepository.findByStatus(s);
    }

    @Transactional
    public ImagingRequest createRequest(ImagingRequest request) {
        if (request.getPatient() == null || request.getPatient().getId() == null) {
            throw new IllegalArgumentException("Patient ID is required");
        }
        if (request.getProcedure() == null || request.getProcedure().getId() == null) {
            throw new IllegalArgumentException("Procedure ID is required");
        }

        PatientProfile patient = patientProfileRepository.findById(request.getPatient().getId())
                .or(() -> patientProfileRepository.findByUserId(request.getPatient().getId()))
                .orElseGet(() -> {
                    User u = userRepository.findById(request.getPatient().getId()).orElse(null);
                    if (u != null) {
                        return patientProfileRepository.save(PatientProfile.builder()
                                .userId(u.getId())
                                .branchId(1L)
                                .opNumber(String.format("MRN-%d-%05d", LocalDate.now().getYear(), u.getId()))
                                .build());
                    }
                    throw new IllegalArgumentException("Patient not found: " + request.getPatient().getId());
                });

        ImagingProcedure procedure = procedureRepository.findById(request.getProcedure().getId())
                .orElseThrow(() -> new IllegalArgumentException("Procedure not found with ID: " + request.getProcedure().getId()));

        request.setPatient(patient);
        request.setProcedure(procedure);

        // Resolve doctor
        Long curUid = SecurityUtils.getCurrentUserId();
        if (request.getDoctor() != null && request.getDoctor().getId() != null) {
            doctorProfileRepository.findById(request.getDoctor().getId()).ifPresent(request::setDoctor);
        } else if (curUid != null) {
            doctorProfileRepository.findByUserId(curUid).ifPresent(request::setDoctor);
        }

        if (request.getPriority() == null) {
            request.setPriority("ROUTINE");
        } else {
            request.setPriority(request.getPriority().toUpperCase());
        }

        request.setStatus("ORDERED");
        request.setQueueStatus("WAITING");
        request.setRequestedAt(ZonedDateTime.now());

        int year = LocalDate.now().getYear();
        long nextId = requestRepository.count() + 1;
        request.setAccessionNumber(String.format("ACC-%d-%05d", year, nextId));
        request.setDicomStudyUid(String.format("1.2.840.113619.2.55.3.%d.%s.%05d", nextId, LocalDate.now().toString().replace("-", ""), nextId));

        ImagingRequest saved = requestRepository.save(request);

        // Auto-create Billing Invoice
        try {
            InvoiceItemRequest item = InvoiceItemRequest.builder()
                    .description("Radiology: " + procedure.getName())
                    .quantity(1)
                    .unitPrice(procedure.getPrice() != null ? procedure.getPrice() : BigDecimal.ZERO)
                    .itemType(ItemType.RADIOLOGY)
                    .referenceId(saved.getId())
                    .build();

            InvoiceRequest invoiceRequest = InvoiceRequest.builder()
                    .patientId(patient.getUserId() != null ? patient.getUserId() : patient.getId())
                    .branchId(saved.getBranch() != null ? saved.getBranch().getId() : 1L)
                    .appointmentId(null)
                    .description("Radiology Request #" + saved.getId() + " (" + procedure.getName() + ")")
                    .dueDate(LocalDateTime.now().plusDays(30))
                    .items(List.of(item))
                    .build();

            InvoiceResponse invoiceResponse = billingService.createInvoice(invoiceRequest);
            if (invoiceResponse != null && invoiceResponse.getId() != null) {
                invoiceRepository.findById(invoiceResponse.getId()).ifPresent(inv -> {
                    saved.setInvoice(inv);
                    requestRepository.save(saved);
                });
            }
        } catch (Exception e) {
            log.warn("Invoice generation note for radiology request #{}: {}", saved.getId(), e.getMessage());
        }

        return saved;
    }

    @Transactional
    public ImagingRequest updateRequestStatus(Long requestId, String newStatus) {
        ImagingRequest request = getRequestById(requestId);
        String s = newStatus.trim().toUpperCase();
        request.setStatus(s);

        ZonedDateTime now = ZonedDateTime.now();
        if ("SCHEDULED".equals(s) && request.getScheduledAt() == null) {
            request.setScheduledAt(now);
        } else if ("CHECKED_IN".equals(s)) {
            request.setCheckedInAt(now);
            request.setQueueStatus("WAITING");
        } else if ("PREPARATION".equals(s)) {
            request.setQueueStatus("PREPARATION");
        } else if ("IN_PROGRESS".equals(s) || "ACQUIRED".equals(s)) {
            if (request.getAcquisitionStartedAt() == null) request.setAcquisitionStartedAt(now);
            if ("ACQUIRED".equals(s)) request.setAcquisitionCompletedAt(now);
            request.setQueueStatus("IN_PROGRESS");
        } else if ("REPORTING".equals(s)) {
            if (request.getAcquisitionCompletedAt() == null) request.setAcquisitionCompletedAt(now);
            request.setQueueStatus("COMPLETED");
        } else if ("VERIFIED".equals(s) || "RELEASED".equals(s) || "COMPLETED".equals(s)) {
            request.setQueueStatus("COMPLETED");
        } else if ("CANCELLED".equals(s)) {
            request.setQueueStatus("CANCELLED");
            if (request.getInvoice() != null) {
                try {
                    billingService.cancelInvoice(request.getInvoice().getId());
                } catch (Exception e) {
                    log.warn("Invoice cancellation note: {}", e.getMessage());
                }
            }
        }

        return requestRepository.save(request);
    }

    @Transactional
    public ImagingRequest scheduleStudy(Long id, ZonedDateTime scheduledAt, Long modalityId) {
        ImagingRequest request = getRequestById(id);
        request.setScheduledAt(scheduledAt != null ? scheduledAt : ZonedDateTime.now().plusHours(2));
        if (modalityId != null) {
            modalityRepository.findById(modalityId).ifPresent(request::setModality);
        }
        request.setStatus("SCHEDULED");
        return requestRepository.save(request);
    }

    @Transactional
    public ImagingRequest checkInPatient(Long id, String queueToken, String prepNotes) {
        ImagingRequest request = getRequestById(id);
        request.setStatus("CHECKED_IN");
        request.setCheckedInAt(ZonedDateTime.now());
        request.setQueueStatus("WAITING");
        if (queueToken != null && !queueToken.trim().isEmpty()) {
            request.setQueueToken(queueToken.trim());
        } else {
            request.setQueueToken(String.format("Q-%03d", id % 1000));
        }
        if (prepNotes != null) {
            request.setPreparationNotes(prepNotes.trim());
            request.setPreparationCompleted(true);
        }
        return requestRepository.save(request);
    }

    @Transactional
    public ImagingRequest startAcquisition(Long id, Long technicianUserId) {
        ImagingRequest request = getRequestById(id);
        request.setStatus("IN_PROGRESS");
        request.setQueueStatus("IN_PROGRESS");
        request.setAcquisitionStartedAt(ZonedDateTime.now());
        if (technicianUserId != null) {
            userRepository.findById(technicianUserId).ifPresent(request::setPerformedByUser);
        }
        return requestRepository.save(request);
    }

    @Transactional
    public ImagingRequest completeAcquisition(Long id, String techNotes) {
        ImagingRequest request = getRequestById(id);
        request.setStatus("REPORTING");
        request.setQueueStatus("COMPLETED");
        request.setAcquisitionCompletedAt(ZonedDateTime.now());
        if (techNotes != null) {
            request.setTechnicianNotes(techNotes.trim());
        }
        return requestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public Optional<RadiologyReport> getReportByRequestId(Long requestId) {
        return reportRepository.findByRequestId(requestId);
    }

    @Transactional
    public RadiologyReport saveReport(Long requestId, RadiologyReport reportInput, UserPrincipal radiologistPrincipal) {
        ImagingRequest request = getRequestById(requestId);

        User radiologist = radiologistPrincipal != null && radiologistPrincipal.getUserId() != null
                ? userRepository.findById(radiologistPrincipal.getUserId()).orElse(null)
                : null;
        if (radiologist == null) {
            Long curUid = SecurityUtils.getCurrentUserId();
            if (curUid != null) radiologist = userRepository.findById(curUid).orElse(null);
        }

        RadiologyReport report = reportRepository.findByRequestId(requestId)
                .orElse(RadiologyReport.builder()
                        .request(request)
                        .radiologist(radiologist)
                        .findings(reportInput.getFindings() != null ? reportInput.getFindings() : "")
                        .impression(reportInput.getImpression() != null ? reportInput.getImpression() : "")
                        .build());

        if (reportInput.getFindings() != null) report.setFindings(reportInput.getFindings());
        if (reportInput.getImpression() != null) report.setImpression(reportInput.getImpression());
        if (reportInput.getRecommendations() != null) report.setRecommendations(reportInput.getRecommendations());
        if (reportInput.getTechnique() != null) report.setTechnique(reportInput.getTechnique());
        if (reportInput.getComparison() != null) report.setComparison(reportInput.getComparison());
        if (reportInput.getClinicalIndication() != null) report.setClinicalIndication(reportInput.getClinicalIndication());
        if (reportInput.getDicomStudyUid() != null) report.setDicomStudyUid(reportInput.getDicomStudyUid());
        if (reportInput.getDicomImageUrl() != null) report.setDicomImageUrl(reportInput.getDicomImageUrl());
        if (reportInput.getStructuredData() != null) report.setStructuredData(reportInput.getStructuredData());

        // Check if critical alert flagged in structured data or direct field
        if (reportInput.getStructuredData() != null && reportInput.getStructuredData().containsKey("isCriticalAlert")) {
            boolean isCrit = Boolean.parseBoolean(String.valueOf(reportInput.getStructuredData().get("isCriticalAlert")));
            if (isCrit) {
                request.setIsCritical(true);
                String cNote = String.valueOf(reportInput.getStructuredData().get("criticalNote"));
                request.setCriticalNotes(cNote != null && !cNote.equals("null") ? cNote : "Immediate actionable finding flagged by radiologist.");
                request.setCriticalAcknowledged(false);
            }
        }

        String targetStatus = reportInput.getStatus() != null ? reportInput.getStatus().toUpperCase() : "DRAFT";
        if ("VERIFIED".equals(targetStatus)) {
            report.setStatus("VERIFIED");
            report.setVerifiedAt(ZonedDateTime.now());
            report.setVerifiedBy(radiologist);
            request.setStatus("VERIFIED");
            eventPublisher.publishEvent("RadiologyReportVerified:" + report.getId());
        } else if ("FINALIZED".equals(targetStatus)) {
            report.setStatus("FINALIZED");
            report.setFinalizedAt(ZonedDateTime.now());
            request.setStatus("RELEASED");
            eventPublisher.publishEvent("RadiologyReportReleased:" + report.getId());
        } else {
            report.setStatus(targetStatus);
            if (!"VERIFIED".equals(request.getStatus()) && !"RELEASED".equals(request.getStatus())) {
                request.setStatus("REPORTING");
            }
        }

        requestRepository.save(request);
        return reportRepository.save(report);
    }

    @Transactional
    public RadiologyReport verifyReport(Long requestId, String comments, UserPrincipal reviewer) {
        ImagingRequest request = getRequestById(requestId);
        RadiologyReport report = reportRepository.findByRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("No report found for imaging request #" + requestId));

        User verifier = reviewer != null && reviewer.getUserId() != null
                ? userRepository.findById(reviewer.getUserId()).orElse(null)
                : null;
        if (verifier == null) {
            Long curUid = SecurityUtils.getCurrentUserId();
            if (curUid != null) verifier = userRepository.findById(curUid).orElse(null);
        }

        report.setStatus("VERIFIED");
        report.setVerifiedAt(ZonedDateTime.now());
        report.setVerifiedBy(verifier);
        if (comments != null && !comments.trim().isEmpty()) {
            report.setRecommendations((report.getRecommendations() != null ? report.getRecommendations() + "\n" : "") + "Reviewer Note: " + comments.trim());
        }

        request.setStatus("VERIFIED");
        requestRepository.save(request);
        return reportRepository.save(report);
    }

    @Transactional
    public ImagingRequest acknowledgeCritical(Long requestId, String acknowledgedBy) {
        ImagingRequest req = getRequestById(requestId);
        req.setCriticalAcknowledged(true);
        req.setCriticalAcknowledgedBy(acknowledgedBy != null ? acknowledgedBy : "Physician On-Duty");
        req.setCriticalAcknowledgedAt(ZonedDateTime.now());
        return requestRepository.save(req);
    }

    @Transactional
    public ImagingRequest bookPatientRequest(Long id, ZonedDateTime scheduledAt, UserPrincipal user) {
        ImagingRequest request = getRequestById(id);
        boolean isSuperAdmin = user.getAuthorities().stream().anyMatch(r -> r.getAuthority().equals("ROLE_SUPER_ADMIN") || r.getAuthority().equals("SUPER_ADMIN"));
        if (!request.getPatient().getUserId().equals(user.getUserId()) && !isSuperAdmin) {
            throw new IllegalArgumentException("Forbidden");
        }
        request.setScheduledAt(scheduledAt);
        request.setStatus("SCHEDULED");
        return requestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public DicomStudyMetadataDto getDicomStudyMetadata(Long requestId) {
        ImagingRequest req = getRequestById(requestId);
        String patientName = "David Miller";
        if (req.getPatient() != null && req.getPatient().getUserId() != null) {
            patientName = userRepository.findById(req.getPatient().getUserId())
                    .map(u -> (u.getFirstName() + " " + (u.getLastName() != null ? u.getLastName() : "")).trim())
                    .orElse("David Miller");
        }
        String modality = (req.getProcedure() != null && req.getProcedure().getModality() != null)
                ? req.getProcedure().getModality().toUpperCase()
                : "CT";

        return DicomStudyMetadataDto.builder()
                .studyInstanceUid(req.getEffectiveDicomStudyUid())
                .accessionNumber(req.getEffectiveAccessionNumber())
                .patientName(patientName)
                .patientId(req.getPatient() != null && req.getPatient().getOpNumber() != null ? req.getPatient().getOpNumber() : "MRN-2026-" + req.getId())
                .modality(modality)
                .procedureName(req.getProcedure() != null ? req.getProcedure().getName() : "Diagnostic Imaging Study")
                .studyDate(req.getRequestedAt() != null ? req.getRequestedAt().toLocalDate().toString() : LocalDate.now().toString())
                .sliceCount(16)
                .seriesCount(3)
                .viewerUrl("/radiologist/viewer?requestId=" + req.getId())
                .build();
    }

    public byte[] generateReportPdf(Long requestId) {
        ImagingRequest req = getRequestById(requestId);
        RadiologyReport report = reportRepository.findByRequestId(requestId).orElse(null);

        String pdfText = "%PDF-1.4\n1 0 obj << /Title (Radiology Diagnostic Imaging Report) /Author (Elixir Health Care) >> endobj\n" +
                "========================================================\n" +
                "ELIXIR HEALTH CARE - DEPARTMENT OF RADIODIAGNOSIS\n" +
                "OFFICIAL MEDICAL IMAGING DIAGNOSTIC REPORT\n" +
                "========================================================\n" +
                "Accession Number : " + req.getEffectiveAccessionNumber() + "\n" +
                "Study UID        : " + req.getEffectiveDicomStudyUid() + "\n" +
                "Procedure        : " + (req.getProcedure() != null ? req.getProcedure().getName() : "Diagnostic Imaging") + "\n" +
                "Modality         : " + (req.getProcedure() != null ? req.getProcedure().getModality() : "XRAY") + "\n" +
                "Status           : " + (report != null ? report.getStatus() : req.getStatus()) + "\n" +
                "Findings         : " + (report != null && report.getFindings() != null ? report.getFindings() : "Study completed without acute radiographic findings.") + "\n" +
                "Impression       : " + (report != null && report.getImpression() != null ? report.getImpression() : "Normal diagnostic examination.") + "\n" +
                "Recommendations  : " + (report != null && report.getRecommendations() != null ? report.getRecommendations() : "Routine clinical follow-up.") + "\n" +
                "Verified At      : " + (report != null && report.getVerifiedAt() != null ? report.getVerifiedAt().toString() : "Pending Verification") + "\n";

        return pdfText.getBytes(StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public List<ImagingRequest> getDoctorRequests(Long doctorUserId) {
        Long dId = doctorUserId != null ? doctorUserId : SecurityUtils.getCurrentUserId();
        if (dId == null) return List.of();
        return requestRepository.findByDoctorIdOrderByRequestedAtDesc(dId);
    }

    @Transactional(readOnly = true)
    public List<ImagingRequest> getPatientReports(Long patientUserId) {
        Long pId = patientUserId != null ? patientUserId : SecurityUtils.getCurrentUserId();
        if (pId == null) return List.of();
        List<ImagingRequest> all = requestRepository.findByPatientProfileOrUserId(pId);
        return all.stream()
                .filter(r -> "VERIFIED".equalsIgnoreCase(r.getStatus()) 
                          || "RELEASED".equalsIgnoreCase(r.getStatus()) 
                          || "COMPLETED".equalsIgnoreCase(r.getStatus()))
                .toList();
    }

    @PostConstruct
    @Transactional
    public void seedStandardProceduresAndModalitiesIfEmpty() {
        try {
            if (modalityRepository.count() == 0) {
                log.info("Seeding standard radiology modalities...");
                List<RadiologyModality> modalities = List.of(
                    RadiologyModality.builder().code("XRAY-01").name("Digital Radiography Room A (Carestream DRX)").modalityType("XRAY").roomLocation("Radiology Suite 101").status("AVAILABLE").build(),
                    RadiologyModality.builder().code("CT-128").name("128-Slice Helical CT Scanner (GE Revolution)").modalityType("CT").roomLocation("CT Gantry Suite 104").status("AVAILABLE").build(),
                    RadiologyModality.builder().code("MRI-3T").name("3.0 Tesla High-Field MRI (Siemens Magnetom)").modalityType("MRI").roomLocation("MRI Shielded Bay 106").status("AVAILABLE").build(),
                    RadiologyModality.builder().code("US-01").name("Color Doppler Ultrasound (Philips EPIQ Elite)").modalityType("ULTRASOUND").roomLocation("Ultrasound Room 102").status("AVAILABLE").build(),
                    RadiologyModality.builder().code("MAMMO-01").name("3D Digital Breast Tomosynthesis (Hologic)").modalityType("MAMMOGRAPHY").roomLocation("Women's Imaging 108").status("AVAILABLE").build(),
                    RadiologyModality.builder().code("DEXA-01").name("Dual-Energy X-ray Absorptiometry (Hologic Horizon)").modalityType("DEXA").roomLocation("Bone Densitometry 110").status("AVAILABLE").build()
                );
                modalityRepository.saveAll(modalities);
            }

            if (procedureRepository.count() == 0) {
                log.info("Seeding standard diagnostic imaging procedure catalog...");
                List<ImagingProcedure> procs = List.of(
                    ImagingProcedure.builder().code("RAD-CXR-01").name("Chest X-Ray PA View").modality("XRAY").bodyPart("Chest").price(new BigDecimal("120.00")).isActive(true).durationMinutes(15).preparationInstructions("Remove metallic objects and jewelry before examination.").build(),
                    ImagingProcedure.builder().code("RAD-MRI-BRAIN").name("Brain MRI with Contrast").modality("MRI").bodyPart("Head/Brain").price(new BigDecimal("650.00")).isActive(true).requiresContrast(true).durationMinutes(45).preparationInstructions("Fasting 4 hours prior. Screen for pacemakers or metallic implants.").build(),
                    ImagingProcedure.builder().code("RAD-CT-ABD").name("Abdominal & Pelvic CT Scan").modality("CT").bodyPart("Abdomen").price(new BigDecimal("480.00")).isActive(true).requiresContrast(true).durationMinutes(30).preparationInstructions("Fasting 6 hours. Oral and IV contrast required.").build(),
                    ImagingProcedure.builder().code("RAD-US-THYROID").name("Thyroid Ultrasound Scan").modality("ULTRASOUND").bodyPart("Neck").price(new BigDecimal("180.00")).isActive(true).durationMinutes(20).preparationInstructions("No special preparation required.").build(),
                    ImagingProcedure.builder().code("RAD-MRI-SPINE").name("Lumbar Spine MRI (L1-S1)").modality("MRI").bodyPart("Spine").price(new BigDecimal("620.00")).isActive(true).durationMinutes(40).preparationInstructions("Screen for metallic implants or claustrophobia.").build(),
                    ImagingProcedure.builder().code("RAD-MAMMO-BIL").name("Bilateral Screening Mammography").modality("MAMMOGRAPHY").bodyPart("Breast").price(new BigDecimal("220.00")).isActive(true).durationMinutes(25).preparationInstructions("Do not use deodorant, talcum powder, or lotions under arms.").build(),
                    ImagingProcedure.builder().code("RAD-DEXA-TOTAL").name("DEXA Bone Mineral Density Scan").modality("DEXA").bodyPart("Full Body / Hip / Spine").price(new BigDecimal("150.00")).isActive(true).durationMinutes(20).preparationInstructions("Avoid calcium supplements for 24 hours prior to scan.").build()
                );
                procedureRepository.saveAll(procs);
            }

            seedDemonstrationDataIfEmpty();
        } catch (Exception e) {
            log.warn("Radiology initialization note: {}", e.getMessage());
        }
    }

    private void seedDemonstrationDataIfEmpty() {
        if (requestRepository.count() > 0) return;

        List<PatientProfile> patients = patientProfileRepository.findAll();
        if (patients.isEmpty()) return;

        PatientProfile patient = patients.get(0);
        List<ImagingProcedure> procedures = procedureRepository.findAll();
        if (procedures.isEmpty()) return;

        ImagingProcedure p1 = procedures.get(0);
        ImagingProcedure p2 = procedures.size() > 1 ? procedures.get(1) : p1;
        ImagingProcedure p3 = procedures.size() > 2 ? procedures.get(2) : p1;
        ImagingProcedure p4 = procedures.size() > 3 ? procedures.get(3) : p1;

        ZonedDateTime now = ZonedDateTime.now();

        List<ImagingRequest> seeds = List.of(
            ImagingRequest.builder().patient(patient).procedure(p1).priority("STAT").status("ORDERED").accessionNumber("ACC-2026-90811").dicomStudyUid("1.2.840.113619.2.55.3.1.20261124.90811").clinicalNotes("Acute shortness of breath and chest discomfort; evaluate for infiltrates or pneumothorax.").requestedAt(now.minusHours(1)).build(),
            ImagingRequest.builder().patient(patient).procedure(p2).priority("URGENT").status("SCHEDULED").scheduledAt(now.plusHours(3)).accessionNumber("ACC-2026-90815").dicomStudyUid("1.2.840.113619.2.55.3.2.20261124.90815").clinicalNotes("Persistent migraines with aura; rule out intracranial mass.").requestedAt(now.minusHours(4)).build(),
            ImagingRequest.builder().patient(patient).procedure(p3).priority("ROUTINE").status("REPORTING").accessionNumber("ACC-2026-90818").dicomStudyUid("1.2.840.113619.2.55.3.3.20261124.90818").clinicalNotes("Right lower quadrant tenderness; evaluate for acute appendicitis.").requestedAt(now.minusDays(1)).build(),
            ImagingRequest.builder().patient(patient).procedure(p4).priority("ROUTINE").status("VERIFIED").accessionNumber("ACC-2026-90820").dicomStudyUid("1.2.840.113619.2.55.3.4.20261124.90820").clinicalNotes("Palpable solitary thyroid nodule routine workup.").requestedAt(now.minusDays(2)).build()
        );

        requestRepository.saveAll(seeds);
        log.info("Standard demonstration imaging requests initialized.");
    }
}
