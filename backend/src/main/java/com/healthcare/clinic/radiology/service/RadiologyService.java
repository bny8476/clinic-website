package com.healthcare.clinic.radiology.service;

import com.healthcare.clinic.billing.dto.InvoiceItemRequest;
import com.healthcare.clinic.billing.dto.InvoiceRequest;
import com.healthcare.clinic.billing.dto.InvoiceResponse;
import com.healthcare.clinic.billing.entity.Invoice;
import com.healthcare.clinic.billing.entity.ItemType;
import com.healthcare.clinic.billing.repository.InvoiceRepository;
import com.healthcare.clinic.billing.service.BillingService;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.radiology.entity.ImagingProcedure;
import com.healthcare.clinic.radiology.entity.ImagingRequest;
import com.healthcare.clinic.radiology.entity.RadiologyReport;
import com.healthcare.clinic.radiology.repository.ImagingProcedureRepository;
import com.healthcare.clinic.radiology.repository.ImagingRequestRepository;
import com.healthcare.clinic.radiology.repository.RadiologyReportRepository;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RadiologyService {

    private final ImagingProcedureRepository procedureRepository;
    private final ImagingRequestRepository requestRepository;
    private final RadiologyReportRepository reportRepository;
    private final BillingService billingService;
    private final InvoiceRepository invoiceRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;

    @Transactional(readOnly = true)
    public List<ImagingProcedure> getProcedures() {
        return procedureRepository.findByIsActiveTrue();
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

    @Transactional
    public List<ImagingRequest> getRequestsByStatus(String status) {
        List<ImagingRequest> requests = requestRepository.findByStatus(status);
        if (requests.isEmpty() && requestRepository.count() == 0) {
            seedDemonstrationDataIfEmpty();
            requests = requestRepository.findByStatus(status);
        }
        return requests;
    }

    private void seedDemonstrationDataIfEmpty() {
        if (requestRepository.count() > 0) return;

        List<PatientProfile> patients = patientProfileRepository.findAll();
        if (patients.isEmpty()) return;

        PatientProfile patient = patients.get(0);

        List<ImagingProcedure> procedures = procedureRepository.findAll();
        if (procedures.isEmpty()) {
            procedures = List.of(
                ImagingProcedure.builder().code("RAD-XRAY-01").name("Chest X-Ray (PA & Lateral)").modality("XRAY").bodyPart("Chest").price(new BigDecimal("120.00")).isActive(true).build(),
                ImagingProcedure.builder().code("RAD-MRI-01").name("Brain MRI with Contrast").modality("MRI").bodyPart("Head").price(new BigDecimal("650.00")).isActive(true).requiresContrast(true).build(),
                ImagingProcedure.builder().code("RAD-CT-01").name("Abdominal & Pelvic CT").modality("CT").bodyPart("Abdomen").price(new BigDecimal("450.00")).isActive(true).build(),
                ImagingProcedure.builder().code("RAD-US-01").name("Thyroid Ultrasound").modality("ULTRASOUND").bodyPart("Neck").price(new BigDecimal("180.00")).isActive(true).build()
            );
            procedures = procedureRepository.saveAll(procedures);
        }

        ImagingProcedure p1 = procedures.get(0);
        ImagingProcedure p2 = procedures.size() > 1 ? procedures.get(1) : p1;
        ImagingProcedure p3 = procedures.size() > 2 ? procedures.get(2) : p1;
        ImagingProcedure p4 = procedures.size() > 3 ? procedures.get(3) : p1;

        ZonedDateTime now = ZonedDateTime.now();

        List<ImagingRequest> seeds = List.of(
            ImagingRequest.builder().patient(patient).procedure(p1).priority("STAT").status("ORDERED").clinicalNotes("Acute shortness of breath and chest discomfort").requestedAt(now.minusHours(1)).build(),
            ImagingRequest.builder().patient(patient).procedure(p2).priority("URGENT").status("SCHEDULED").scheduledAt(now.plusHours(4)).clinicalNotes("Persistent migraines").requestedAt(now.minusHours(5)).build(),
            ImagingRequest.builder().patient(patient).procedure(p3).priority("ROUTINE").status("REPORTING").clinicalNotes("Follow-up scan").requestedAt(now.minusDays(1)).build(),
            ImagingRequest.builder().patient(patient).procedure(p4).priority("ROUTINE").status("VERIFIED").clinicalNotes("Thyroid nodule check").requestedAt(now.minusDays(2)).build(),
            ImagingRequest.builder().patient(patient).procedure(p1).priority("URGENT").status("RELEASED").clinicalNotes("Routine clearance").requestedAt(now.minusDays(3)).build(),
            ImagingRequest.builder().patient(patient).procedure(p2).priority("ROUTINE").status("ORDERED").clinicalNotes("Pre-op screening").requestedAt(now.minusHours(3)).build()
        );

        requestRepository.saveAll(seeds);
    }

    @Transactional
    public ImagingRequest bookPatientRequest(Long id, ZonedDateTime scheduledAt, UserPrincipal user) {
        ImagingRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        
        boolean isSuperAdmin = user.getAuthorities().stream().anyMatch(r -> r.getAuthority().equals("ROLE_SUPER_ADMIN") || r.getAuthority().equals("SUPER_ADMIN"));
        if (!request.getPatient().getUserId().equals(user.getUserId()) && !isSuperAdmin) {
            throw new IllegalArgumentException("Forbidden");
        }
        
        request.setScheduledAt(scheduledAt);
        request.setStatus("SCHEDULED");
        return requestRepository.save(request);
    }

    @Transactional
    public ImagingRequest createRequest(ImagingRequest request) {
        ZonedDateTime startOfDay = ZonedDateTime.now().toLocalDate().atStartOfDay(ZoneId.systemDefault());
        if (requestRepository.existsByPatientIdAndProcedureIdAndRequestedAtGreaterThanEqual(
                request.getPatient().getId(), request.getProcedure().getId(), startOfDay)) {
            throw new IllegalArgumentException("A request for this procedure was already created today.");
        }

        request.setStatus("ORDERED");
        request = requestRepository.save(request);

        InvoiceItemRequest item = InvoiceItemRequest.builder()
                .description("Radiology: " + request.getProcedure().getName())
                .quantity(1)
                .unitPrice(request.getProcedure().getPrice() != null ? request.getProcedure().getPrice() : BigDecimal.ZERO)
                .itemType(ItemType.RADIOLOGY)
                .referenceId(request.getId())
                .build();

        InvoiceRequest invoiceRequest = InvoiceRequest.builder()
                .patientId(request.getPatient().getUserId())
                .branchId(request.getBranch() != null ? request.getBranch().getId() : null)
                .appointmentId(null)
                .description("Radiology Request #" + request.getId())
                .dueDate(LocalDateTime.now().plusDays(30))
                .items(List.of(item))
                .build();

        try {
            InvoiceResponse invoiceResponse = billingService.createInvoice(invoiceRequest);
            Invoice invoice = invoiceRepository.findById(invoiceResponse.getId()).orElse(null);
            request.setInvoice(invoice);
            request = requestRepository.save(request);
        } catch (Exception e) {
            System.err.println("Error creating invoice for radiology request: " + e.getMessage());
            e.printStackTrace();
        }

        return request;
    }

    @Transactional
    public ImagingRequest updateRequestStatus(Long requestId, String newStatus) {
        ImagingRequest request = requestRepository.findById(requestId).orElseThrow();
        String currentStatus = request.getStatus();

        if (!isValidTransition(currentStatus, newStatus)) {
            throw new IllegalStateException("Invalid status transition from " + currentStatus + " to " + newStatus);
        }

        request.setStatus(newStatus);
        
        if ("SCHEDULED".equals(newStatus) && request.getScheduledAt() == null) {
            request.setScheduledAt(ZonedDateTime.now());
        }

        if ("CANCELLED".equals(newStatus) && request.getInvoice() != null) {
            try {
                billingService.cancelInvoice(request.getInvoice().getId());
            } catch (Exception e) {
                // Ignore billing error on cancellation
            }
        }

        return requestRepository.save(request);
    }

    private boolean isValidTransition(String currentStatus, String newStatus) {
        if (currentStatus.equals(newStatus)) return true;
        return switch (currentStatus) {
            case "DRAFT" -> List.of("ORDERED", "SCHEDULED", "CANCELLED").contains(newStatus);
            case "ORDERED" -> List.of("SCHEDULED", "IMAGE_ACQUIRED", "REPORTING", "VERIFIED", "RELEASED", "CANCELLED").contains(newStatus);
            case "SCHEDULED" -> List.of("IMAGE_ACQUIRED", "REPORTING", "VERIFIED", "RELEASED", "CANCELLED").contains(newStatus);
            case "IMAGE_ACQUIRED" -> List.of("REPORTING", "VERIFIED", "RELEASED").contains(newStatus);
            case "REPORTING" -> List.of("VERIFIED", "RELEASED").contains(newStatus);
            case "VERIFIED" -> List.of("RELEASED").contains(newStatus);
            default -> true;
        };
    }

    @Transactional(readOnly = true)
    public Optional<RadiologyReport> getReportByRequestId(Long requestId) {
        return reportRepository.findByRequestId(requestId);
    }

    @Transactional
    public RadiologyReport saveReport(Long requestId, RadiologyReport reportInput, UserPrincipal radiologistPrincipal) {
        ImagingRequest request = requestRepository.findById(requestId).orElseThrow();
        
        User radiologist = radiologistPrincipal != null && radiologistPrincipal.getUserId() != null
                ? userRepository.findById(radiologistPrincipal.getUserId()).orElse(null)
                : null;

        RadiologyReport report = reportRepository.findByRequestId(requestId)
                .orElse(RadiologyReport.builder()
                        .request(request)
                        .radiologist(radiologist)
                        .build());

        if ("VERIFIED".equals(report.getStatus())) {
            throw new IllegalStateException("Cannot edit a verified report. Create an addendum instead.");
        }

        report.setFindings(reportInput.getFindings());
        report.setImpression(reportInput.getImpression());
        report.setDicomStudyUid(reportInput.getDicomStudyUid());
        report.setDicomImageUrl(reportInput.getDicomImageUrl());
        report.setStructuredData(reportInput.getStructuredData());
        
        if (reportInput.getStatus() != null) {
            if ("VERIFIED".equals(reportInput.getStatus())) {
                report.setStatus("VERIFIED");
                report.setVerifiedAt(ZonedDateTime.now());
                report.setVerifiedBy(radiologist);
                updateRequestStatus(requestId, "VERIFIED");
                eventPublisher.publishEvent("RadiologyReportVerified:" + report.getId());
            } else if ("FINALIZED".equals(reportInput.getStatus())) {
                report.setStatus("FINALIZED");
                report.setFinalizedAt(ZonedDateTime.now());
                updateRequestStatus(requestId, "RELEASED");
                eventPublisher.publishEvent("RadiologyReportReleased:" + report.getId());
            } else {
                report.setStatus(reportInput.getStatus());
            }
        }
        return reportRepository.save(report);
    }
}
