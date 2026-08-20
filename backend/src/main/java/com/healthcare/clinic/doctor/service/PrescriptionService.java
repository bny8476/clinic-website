package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.exception.ResourceNotFoundException;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.doctor.dto.PrescriptionItemResponse;
import com.healthcare.clinic.doctor.dto.PrescriptionRequest;
import com.healthcare.clinic.doctor.dto.PrescriptionResponse;
import com.healthcare.clinic.doctor.entity.Prescription;
import com.healthcare.clinic.doctor.entity.PrescriptionItem;
import com.healthcare.clinic.doctor.repository.PrescriptionRepository;
import com.healthcare.clinic.security.SecurityUtils;
import com.healthcare.clinic.clinicaldecision.service.CdsSafetyCheckService;
import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import com.healthcare.clinic.laboratory.repository.LabTestCatalogRepository;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.appointment.entity.Appointment;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;

import com.healthcare.clinic.doctor.entity.ClinicOutboxEvent;
import com.healthcare.clinic.doctor.repository.ClinicOutboxEventRepository;
import com.healthcare.clinic.doctor.dto.OutboxPrescriptionPayload;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final ClinicOutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UserRepository userRepository;
    private final CdsSafetyCheckService cdsSafetyCheckService;
    private final com.healthcare.clinic.clinicaldecision.service.DrugInteractionService drugInteractionService;
    private final ApplicationEventPublisher eventPublisher;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final BranchRepository branchRepository;
    private final LabTestCatalogRepository labTestCatalogRepository;
    private final LabTestRequestRepository labTestRequestRepository;
    private final com.healthcare.clinic.nursing.repository.MedicationAdministrationRecordRepository marRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getPrescriptionsForPatient(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Prescription> getPrescriptionsByEncounter(Long encounterId) {
        return prescriptionRepository.findByEncounterId(encounterId);
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
        return mapToResponse(prescription);
    }

    @Transactional(readOnly = true)
    public void performSafetyCheckOnly(Long patientId, List<String> medicationNames) {
        Long doctorId = SecurityUtils.getCurrentUserId();
        cdsSafetyCheckService.performSynchronousSafetyCheck(patientId, medicationNames, doctorId);
    }

    @Transactional
    public PrescriptionResponse createPrescription(PrescriptionRequest request) {
        Long doctorId = SecurityUtils.getCurrentUserId();

        if (!userRepository.existsById(request.getPatientId())) {
            throw new ResourceNotFoundException("Patient not found with id: " + request.getPatientId());
        }

        List<String> medNames = request.getItems().stream()
                .map(item -> item != null ? item.getMedicationName() : null)
                .collect(Collectors.toList());

        // 1. SYNCHRONOUS BLOCKING SAFETY GATE: Drug allergy & contraindication check BEFORE save
        cdsSafetyCheckService.performSynchronousSafetyCheck(request.getPatientId(), medNames, doctorId);

        // 1.5 Drug Interaction Check
        if (request.getOverrideReason() == null || request.getOverrideReason().trim().isEmpty()) {
            List<String> interactions = drugInteractionService.checkInteractions(medNames);
            if (!interactions.isEmpty()) {
                throw new com.healthcare.clinic.clinicaldecision.exception.CdsCriticalSafetyException(
                        "Critical drug interactions found. Provide override_reason to bypass.", interactions);
            }
        }

        // ── Build clinical prescription ──────────────────────────────────────
        Prescription prescription = Prescription.builder()
                .patientId(request.getPatientId())
                .doctorId(doctorId)
                .appointmentId(request.getAppointmentId())
                .notes(request.getNotes())
                .chiefComplaint(request.getChiefComplaint())
                .diagnosis(request.getDiagnosis())
                .diagnosisId(request.getDiagnosisId())
                .overrideReason(request.getOverrideReason())
                .symptoms(request.getSymptoms())
                .medicalHistory(request.getMedicalHistory())
                .followUpDate(request.getFollowUpDate())
                .pharmacyStatus("PENDING")
                .build();

        request.getItems().forEach(itemRequest -> {
            PrescriptionItem item = PrescriptionItem.builder()
                    .medicationName(itemRequest.getMedicationName())
                    .type(itemRequest.getType())
                    .dosage(itemRequest.getDosage())
                    .frequency(itemRequest.getFrequency())
                    .duration(itemRequest.getDuration())
                    .instructions(itemRequest.getInstructions())
                    .strength(itemRequest.getStrength())
                    .timing(itemRequest.getTiming())
                    .medicineId(itemRequest.getMedicineId())
                    .prescribedQuantity(itemRequest.getPrescribedQuantity())
                    .remainingQuantity(itemRequest.getPrescribedQuantity())
                    .dispensedQuantity(0)
                    .build();
            prescription.addItem(item);
        });

        Prescription saved = prescriptionRepository.save(prescription);

        // ── Build linked pharmacy prescription (same transaction) ────────────
        String patientName = userRepository.findById(request.getPatientId())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown Patient");
        String doctorName = userRepository.findById(doctorId)
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown Doctor");

        List<OutboxPrescriptionPayload.OutboxPrescriptionItem> outboxItems = request.getItems().stream().map(itemRequest -> 
            OutboxPrescriptionPayload.OutboxPrescriptionItem.builder()
                .medicationName(itemRequest.getMedicationName())
                .type(itemRequest.getType())
                .dosage(itemRequest.getDosage())
                .frequency(itemRequest.getFrequency())
                .duration(itemRequest.getDuration())
                .instructions(itemRequest.getInstructions())
                .strength(itemRequest.getStrength())
                .timing(itemRequest.getTiming())
                .medicineId(itemRequest.getMedicineId())
                .prescribedQuantity(itemRequest.getPrescribedQuantity())
                .dispensedQuantity(0)
                .remainingQuantity(itemRequest.getPrescribedQuantity())
                .build()
        ).collect(Collectors.toList());

        OutboxPrescriptionPayload payload = OutboxPrescriptionPayload.builder()
                .patientName(patientName)
                .doctorName(doctorName)
                .clinicalPrescriptionId(saved.getId())
                .items(outboxItems)
                .build();
        
        try {
            ClinicOutboxEvent event = ClinicOutboxEvent.builder()
                    .aggregateType("PRESCRIPTION")
                    .aggregateId(saved.getId().toString())
                    .eventType("PRESCRIPTION_CREATED")
                    .payload(objectMapper.writeValueAsString(payload))
                    .status("PENDING")
                    .build();
            outboxEventRepository.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event", e);
        }

        // ── Auto-create MAR records for Injections ─────────────────────────
        saved.getItems().forEach(item -> {
            if ("Injection".equalsIgnoreCase(item.getType())) {
                com.healthcare.clinic.nursing.entity.MedicationAdministrationRecord mar = 
                        new com.healthcare.clinic.nursing.entity.MedicationAdministrationRecord();
                mar.setPatientId(saved.getPatientId());
                mar.setPrescriptionItemId(item.getId());
                mar.setPatientName(patientName);
                mar.setMedicationName(item.getMedicationName());
                mar.setDosage(item.getDosage());
                mar.setStatus(com.healthcare.clinic.nursing.entity.MarStatus.DUE);
                marRepository.save(mar);
            }
        });

        // ── Build Lab Requests ───────────────────────────────────────────────
        if (request.getLabTestCatalogIds() != null && !request.getLabTestCatalogIds().isEmpty()) {
            PatientProfile patientProfile = patientProfileRepository.findByUserId(request.getPatientId()).orElse(null);
            if (patientProfile != null) {
                for (Long catalogId : request.getLabTestCatalogIds()) {
                    labTestCatalogRepository.findById(catalogId).ifPresent(catalog -> {
                        LabTestRequest labReq = LabTestRequest.builder()
                                .patient(patientProfile)
                                .testCatalog(catalog)
                                .status("REQUESTED")
                                .priority("ROUTINE")
                                .requestedAt(java.time.ZonedDateTime.now())
                                .build();
                        labTestRequestRepository.save(labReq);
                    });
                }
            }
        }

        // 2. ASYNC DOMAIN EVENT: Published AFTER successful save for non-blocking CDS rules engine
        eventPublisher.publishEvent(com.healthcare.clinic.clinicaldecision.event.PrescriptionCreatedEvent.builder()
                .patientId(request.getPatientId())
                .prescriptionId(saved.getId())
                .medicationNames(medNames)
                .doctorId(doctorId)
                .build());

        return mapToResponse(saved);
    }


    @Transactional
    public PrescriptionResponse updateDraft(Long id, PrescriptionRequest request) {
        Long doctorId = SecurityUtils.getCurrentUserId();

        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        if (!prescription.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Not authorized to update this prescription");
        }
        
        if (!"DRAFT".equals(prescription.getPharmacyStatus())) {
            throw new RuntimeException("Only DRAFT prescriptions can be updated");
        }

        prescription.setAppointmentId(request.getAppointmentId());
        prescription.setNotes(request.getNotes());
        prescription.setChiefComplaint(request.getChiefComplaint());
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setSymptoms(request.getSymptoms());
        prescription.setMedicalHistory(request.getMedicalHistory());
        prescription.setFollowUpDate(request.getFollowUpDate());

        prescription.getItems().clear();
        request.getItems().forEach(itemRequest -> {
            PrescriptionItem item = PrescriptionItem.builder()
                    .medicationName(itemRequest.getMedicationName())
                    .type(itemRequest.getType())
                    .dosage(itemRequest.getDosage())
                    .frequency(itemRequest.getFrequency())
                    .duration(itemRequest.getDuration())
                    .instructions(itemRequest.getInstructions())
                    .strength(itemRequest.getStrength())
                    .timing(itemRequest.getTiming())
                    .medicineId(itemRequest.getMedicineId())
                    .prescribedQuantity(itemRequest.getPrescribedQuantity())
                    .remainingQuantity(itemRequest.getPrescribedQuantity())
                    .dispensedQuantity(0)
                    .build();
            prescription.addItem(item);
        });

        Prescription saved = prescriptionRepository.save(prescription);
        return mapToResponse(saved);
    }

    @Transactional
    public PrescriptionResponse saveDraft(PrescriptionRequest request) {
        Long doctorId = SecurityUtils.getCurrentUserId();

        if (!userRepository.existsById(request.getPatientId())) {
            throw new ResourceNotFoundException("Patient not found with id: " + request.getPatientId());
        }

        Prescription prescription = Prescription.builder()
                .patientId(request.getPatientId())
                .doctorId(doctorId)
                .appointmentId(request.getAppointmentId())
                .notes(request.getNotes())
                .chiefComplaint(request.getChiefComplaint())
                .diagnosis(request.getDiagnosis())
                .symptoms(request.getSymptoms())
                .medicalHistory(request.getMedicalHistory())
                .followUpDate(request.getFollowUpDate())
                .pharmacyStatus("DRAFT")
                .build();

        request.getItems().forEach(itemRequest -> {
            PrescriptionItem item = PrescriptionItem.builder()
                    .medicationName(itemRequest.getMedicationName())
                    .type(itemRequest.getType())
                    .dosage(itemRequest.getDosage())
                    .frequency(itemRequest.getFrequency())
                    .duration(itemRequest.getDuration())
                    .instructions(itemRequest.getInstructions())
                    .strength(itemRequest.getStrength())
                    .timing(itemRequest.getTiming())
                    .medicineId(itemRequest.getMedicineId())
                    .prescribedQuantity(itemRequest.getPrescribedQuantity())
                    .remainingQuantity(itemRequest.getPrescribedQuantity())
                    .dispensedQuantity(0)
                    .build();
            prescription.addItem(item);
        });

        Prescription saved = prescriptionRepository.save(prescription);
        return mapToResponse(saved);
    }

    @Transactional
    public PrescriptionResponse sendPrescription(Long id, Long pharmacyUserId) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        Long doctorId = SecurityUtils.getCurrentUserId();
        if (!prescription.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Not authorized to send this prescription");
        }

        if ("PENDING".equals(prescription.getPharmacyStatus()) || "SENT".equals(prescription.getPharmacyStatus())) {
            return mapToResponse(prescription);
        }

        if (!"DRAFT".equals(prescription.getPharmacyStatus())) {
            throw new RuntimeException("Prescription is not in DRAFT status");
        }

        prescription.setPharmacyStatus("PENDING");
        if (pharmacyUserId != null) {
            prescription.setAssignedPharmacyUserId(pharmacyUserId);
        }
        Prescription saved = prescriptionRepository.save(prescription);

        String patientName = userRepository.findById(prescription.getPatientId())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown Patient");
        String doctorName = userRepository.findById(doctorId)
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown Doctor");

        List<OutboxPrescriptionPayload.OutboxPrescriptionItem> outboxItems = prescription.getItems().stream().map(item -> 
            OutboxPrescriptionPayload.OutboxPrescriptionItem.builder()
                .medicationName(item.getMedicationName())
                .type(item.getType())
                .dosage(item.getDosage())
                .frequency(item.getFrequency())
                .duration(item.getDuration())
                .instructions(item.getInstructions())
                .strength(item.getStrength())
                .timing(item.getTiming())
                .medicineId(item.getMedicineId())
                .prescribedQuantity(item.getPrescribedQuantity())
                .dispensedQuantity(item.getDispensedQuantity())
                .remainingQuantity(item.getRemainingQuantity())
                .build()
        ).collect(Collectors.toList());

        OutboxPrescriptionPayload payload = OutboxPrescriptionPayload.builder()
                .patientName(patientName)
                .doctorName(doctorName)
                .clinicalPrescriptionId(saved.getId())
                .pharmacyUserId(pharmacyUserId)
                .items(outboxItems)
                .build();
        
        try {
            ClinicOutboxEvent event = ClinicOutboxEvent.builder()
                    .aggregateType("PRESCRIPTION")
                    .aggregateId(saved.getId().toString())
                    .eventType("PRESCRIPTION_SENT")
                    .payload(objectMapper.writeValueAsString(payload))
                    .status("PENDING")
                    .build();
            outboxEventRepository.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event", e);
        }

        List<String> medNames = prescription.getItems().stream()
                .map(item -> item != null ? item.getMedicationName() : null)
                .collect(Collectors.toList());

        eventPublisher.publishEvent(com.healthcare.clinic.clinicaldecision.event.PrescriptionCreatedEvent.builder()
                .patientId(prescription.getPatientId())
                .prescriptionId(saved.getId())
                .medicationNames(medNames)
                .doctorId(doctorId)
                .assignedPharmacyUserId(pharmacyUserId)
                .build());

        return mapToResponse(saved);
    }

    private PrescriptionResponse mapToResponse(Prescription prescription) {
        String patientName = userRepository.findById(prescription.getPatientId())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown Patient");

        String doctorName = userRepository.findById(prescription.getDoctorId())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown Doctor");

        com.healthcare.clinic.patient.entity.PatientProfile patientProfile = patientProfileRepository.findByUserId(prescription.getPatientId()).orElse(null);
        Integer patientAge = patientProfile != null && patientProfile.getDateOfBirth() != null ? java.time.Period.between(patientProfile.getDateOfBirth(), java.time.LocalDate.now()).getYears() : null;
        String patientGender = patientProfile != null ? patientProfile.getGender() : null;

        com.healthcare.clinic.doctor.entity.DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(prescription.getDoctorId()).orElse(null);
        String doctorSpecialty = doctorProfile != null ? doctorProfile.getSpecialty() : null;
        String doctorQualifications = doctorProfile != null ? doctorProfile.getQualifications() : null;
        String registrationNumber = doctorProfile != null ? doctorProfile.getRegistrationNumber() : null;

        com.healthcare.clinic.branch.entity.Branch branch = (doctorProfile != null && doctorProfile.getBranchId() != null) 
            ? branchRepository.findById(doctorProfile.getBranchId()).orElse(null) 
            : null;
            
        String clinicName = branch != null ? branch.getName() : null;
        String clinicAddress = branch != null ? branch.getAddress() : null;
        String clinicPhone = branch != null ? branch.getPhoneNumber() : null;
        String clinicEmail = branch != null ? branch.getEmail() : null;

        List<PrescriptionItemResponse> itemResponses = prescription.getItems().stream()
                .map(item -> PrescriptionItemResponse.builder()
                        .id(item.getId())
                        .medicationName(item.getMedicationName())
                        .type(item.getType())
                        .dosage(item.getDosage())
                        .frequency(item.getFrequency())
                        .duration(item.getDuration())
                        .instructions(item.getInstructions())
                        .medicineId(item.getMedicineId())
                        .prescribedQuantity(item.getPrescribedQuantity())
                        .dispensedQuantity(item.getDispensedQuantity())
                        .remainingQuantity(item.getRemainingQuantity())
                        .build())
                .collect(Collectors.toList());

        return PrescriptionResponse.builder()
                .id(prescription.getId())
                .patientId(prescription.getPatientId())
                .patientName(patientName)
                .patientAge(patientAge)
                .patientGender(patientGender)
                .doctorSpecialty(doctorSpecialty)
                .doctorQualifications(doctorQualifications)
                .registrationNumber(registrationNumber)
                .clinicName(clinicName)
                .clinicAddress(clinicAddress)
                .clinicPhone(clinicPhone)
                .clinicEmail(clinicEmail)
                .doctorId(prescription.getDoctorId())
                .doctorName(doctorName)
                .appointmentId(prescription.getAppointmentId())
                .chiefComplaint(prescription.getChiefComplaint())
                .diagnosis(prescription.getDiagnosis())
                .symptoms(prescription.getSymptoms())
                .medicalHistory(prescription.getMedicalHistory())
                .followUpDate(prescription.getFollowUpDate())
                .notes(prescription.getNotes())
                .encounterId(prescription.getEncounterId())
                .status(prescription.getStatus())
                .signedAt(prescription.getSignedAt())
                .signatureHash(prescription.getSignatureHash())
                .pharmacyStatus(prescription.getPharmacyStatus())
                .dispensedAt(prescription.getDispensedAt())
                .dispensedBy(prescription.getDispensedBy())
                .items(itemResponses)
                .createdAt(prescription.getCreatedAt())
                .updatedAt(prescription.getUpdatedAt())
                .refillsAllowed(prescription.getRefillsAllowed())
                .refillsRemaining(prescription.getRefillsRemaining())
                .refillIntervalDays(prescription.getRefillIntervalDays())
                .build();
    }

    @Transactional
    public PrescriptionResponse voidPrescription(Long id, String reason) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!prescription.getDoctorId().equals(currentUserId)) {
            throw new RuntimeException("Not authorized to void this prescription");
        }

        if (prescription.getCreatedAt().plusMinutes(15).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot void prescription after 15 minutes");
        }

        prescription.setStatus("Void");
        prescription.setVoidedAt(LocalDateTime.now());
        prescription.setVoidReason(reason);
        prescription.setPharmacyStatus("VOIDED");

        // also void pharmacy side
        
        try {
            ClinicOutboxEvent event = ClinicOutboxEvent.builder()
                    .aggregateType("PRESCRIPTION")
                    .aggregateId(id.toString())
                    .eventType("PRESCRIPTION_VOIDED")
                    .payload("{}")
                    .status("PENDING")
                    .build();
            outboxEventRepository.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event", e);
        }


        Prescription saved = prescriptionRepository.save(prescription);
        return mapToResponse(saved);
    }

        @Transactional
    public byte[] generatePdf(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        try (java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            com.lowagie.text.Document document = new com.lowagie.text.Document(com.lowagie.text.PageSize.A4);
            com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
            document.open();

            com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 18);
            com.lowagie.text.Font subtitleFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA, 10);
            com.lowagie.text.Font boldFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 10);
            com.lowagie.text.Font normalFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA, 10);
            com.lowagie.text.Font rxFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.TIMES_BOLDITALIC, 24);

            com.healthcare.clinic.identity.entity.User doctorUser = userRepository.findById(prescription.getDoctorId()).orElse(null);
            String doctorName = doctorUser != null ? "Dr. " + doctorUser.getFirstName() + " " + doctorUser.getLastName() : "Dr. Unknown";
            
            com.healthcare.clinic.doctor.entity.DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(prescription.getDoctorId()).orElse(null);
            String doctorSpecialty = doctorProfile != null && doctorProfile.getSpecialty() != null ? doctorProfile.getSpecialty() : "General Practitioner";
            String doctorQualifications = doctorProfile != null && doctorProfile.getQualifications() != null ? doctorProfile.getQualifications() : "";
            String registrationNumber = doctorProfile != null && doctorProfile.getRegistrationNumber() != null ? doctorProfile.getRegistrationNumber() : "";

            com.healthcare.clinic.branch.entity.Branch branch = null;
            if (prescription.getAppointmentId() != null) {
                Appointment appointment = appointmentRepository.findById(prescription.getAppointmentId()).orElse(null);
                if (appointment != null && appointment.getBranchId() != null) {
                    branch = branchRepository.findById(appointment.getBranchId()).orElse(null);
                }
            } else if (doctorProfile != null && doctorProfile.getBranchId() != null) {
                branch = branchRepository.findById(doctorProfile.getBranchId()).orElse(null);
            }

            String clinicName = branch != null && branch.getName() != null ? branch.getName() : "";
            String clinicAddress = branch != null && branch.getAddress() != null ? branch.getAddress() : "";
            String clinicPhone = branch != null && branch.getPhoneNumber() != null ? branch.getPhoneNumber() : "";
            
            com.healthcare.clinic.identity.entity.User patientUser = userRepository.findById(prescription.getPatientId()).orElse(null);
            String patientName = patientUser != null ? patientUser.getFirstName() + " " + patientUser.getLastName() : "Unknown Patient";
            String patientAgeSex = "N/A / N/A";
            
            com.healthcare.clinic.patient.entity.PatientProfile patientProfile = patientProfileRepository.findByUserId(prescription.getPatientId()).orElse(null);
            if (patientProfile != null) {
                if (patientProfile.getDateOfBirth() != null) {
                    patientAgeSex = java.time.Period.between(patientProfile.getDateOfBirth(), java.time.LocalDate.now()).getYears() + " Y / " + (patientProfile.getGender() != null ? patientProfile.getGender() : "N/A");
                }
            }

            // Header
            com.lowagie.text.Paragraph clinicTitle = new com.lowagie.text.Paragraph(clinicName, titleFont);
            document.add(clinicTitle);
            document.add(new com.lowagie.text.Paragraph(clinicAddress, subtitleFont));
            document.add(new com.lowagie.text.Paragraph("Phone: " + clinicPhone, subtitleFont));
            document.add(new com.lowagie.text.Paragraph(" "));
            
            // Divider
            com.lowagie.text.pdf.draw.LineSeparator ls = new com.lowagie.text.pdf.draw.LineSeparator();
            document.add(new com.lowagie.text.Chunk(ls));
            document.add(new com.lowagie.text.Paragraph(" "));

            // Doctor Info
            document.add(new com.lowagie.text.Paragraph(doctorName, boldFont));
            document.add(new com.lowagie.text.Paragraph(doctorSpecialty, normalFont));
            if (!doctorQualifications.isEmpty()) document.add(new com.lowagie.text.Paragraph(doctorQualifications, normalFont));
            if (!registrationNumber.isEmpty()) document.add(new com.lowagie.text.Paragraph("Reg No: " + registrationNumber, normalFont));
            document.add(new com.lowagie.text.Paragraph(" "));

            // Patient Info
            com.lowagie.text.pdf.PdfPTable patientTable = new com.lowagie.text.pdf.PdfPTable(2);
            patientTable.setWidthPercentage(100);
            patientTable.addCell(new com.lowagie.text.Phrase("Name: " + patientName, normalFont));
            patientTable.addCell(new com.lowagie.text.Phrase("Date: " + prescription.getCreatedAt().toLocalDate(), normalFont));
            patientTable.addCell(new com.lowagie.text.Phrase("Age/Sex: " + patientAgeSex, normalFont));
            patientTable.addCell(new com.lowagie.text.Phrase("Patient ID: " + prescription.getPatientId(), normalFont));
            document.add(patientTable);
            document.add(new com.lowagie.text.Paragraph(" "));

            // Clinical Notes
            if (prescription.getChiefComplaint() != null && !prescription.getChiefComplaint().isEmpty()) {
                document.add(new com.lowagie.text.Paragraph("Chief Complaint: " + prescription.getChiefComplaint(), normalFont));
            }
            if (prescription.getDiagnosis() != null && !prescription.getDiagnosis().isEmpty()) {
                document.add(new com.lowagie.text.Paragraph("Diagnosis: " + prescription.getDiagnosis(), normalFont));
                document.add(new com.lowagie.text.Paragraph(" "));
            }

            // Rx
            document.add(new com.lowagie.text.Paragraph("Rx", rxFont));
            document.add(new com.lowagie.text.Paragraph(" "));

            com.lowagie.text.pdf.PdfPTable itemsTable = new com.lowagie.text.pdf.PdfPTable(5);
            itemsTable.setWidthPercentage(100);
            itemsTable.addCell(new com.lowagie.text.Phrase("Medicine", boldFont));
            itemsTable.addCell(new com.lowagie.text.Phrase("Dosage", boldFont));
            itemsTable.addCell(new com.lowagie.text.Phrase("Frequency", boldFont));
            itemsTable.addCell(new com.lowagie.text.Phrase("Duration", boldFont));
            itemsTable.addCell(new com.lowagie.text.Phrase("Instructions", boldFont));

            for (PrescriptionItem item : prescription.getItems()) {
                String med = item.getMedicationName();
                if (item.getType() != null) med += " (" + item.getType() + ")";
                if (item.getStrength() != null) med += " " + item.getStrength();
                
                itemsTable.addCell(new com.lowagie.text.Phrase(med, normalFont));
                itemsTable.addCell(new com.lowagie.text.Phrase(item.getDosage() != null ? item.getDosage() : "", normalFont));
                String freq = item.getFrequency() != null ? item.getFrequency() : "";
                if (item.getTiming() != null) freq += "\n" + item.getTiming();
                itemsTable.addCell(new com.lowagie.text.Phrase(freq, normalFont));
                itemsTable.addCell(new com.lowagie.text.Phrase(item.getDuration() != null ? item.getDuration() : "", normalFont));
                itemsTable.addCell(new com.lowagie.text.Phrase(item.getInstructions() != null ? item.getInstructions() : "", normalFont));
            }
            document.add(itemsTable);
            document.add(new com.lowagie.text.Paragraph(" "));

            // Footer
            if (prescription.getFollowUpDate() != null) {
                document.add(new com.lowagie.text.Paragraph("Follow-up Date: " + prescription.getFollowUpDate(), boldFont));
            }

            document.add(new com.lowagie.text.Paragraph(" "));
            document.add(new com.lowagie.text.Paragraph(" "));
            com.lowagie.text.Paragraph signature = new com.lowagie.text.Paragraph("Doctor's Signature", normalFont);
            signature.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
            document.add(signature);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }

    @Transactional
    public PrescriptionResponse signPrescription(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!prescription.getDoctorId().equals(currentUserId)) {
            throw new RuntimeException("Only the prescribing doctor can sign this prescription.");
        }

        if (!"Draft".equals(prescription.getStatus())) {
            throw new RuntimeException("Only Draft prescriptions can be signed.");
        }

        prescription.setStatus("Signed");
        prescription.setSignedAt(LocalDateTime.now());
        
        // True SHA-256 tamper-evident hash
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            StringBuilder sb = new StringBuilder();
            sb.append(prescription.getId()).append("|");
            sb.append(prescription.getPatientId()).append("|");
            sb.append(prescription.getDoctorId()).append("|");
            sb.append(prescription.getDoctorRegistrationNumber() != null ? prescription.getDoctorRegistrationNumber() : "UNREGISTERED").append("|");
            if (prescription.getItems() != null) {
                for (com.healthcare.clinic.doctor.entity.PrescriptionItem item : prescription.getItems()) {
                    sb.append(item.getMedicineId()).append(":")
                      .append(item.getPrescribedQuantity()).append(":")
                      .append(item.getDosage()).append("|");
                }
            }
            sb.append(prescription.getSignedAt().toString());
            byte[] hash = digest.digest(sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            String encodedHash = java.util.Base64.getEncoder().encodeToString(hash);
            prescription.setSignatureHash(encodedHash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate signature hash", e);
        }

        return mapToResponse(prescriptionRepository.save(prescription));
    }



}
