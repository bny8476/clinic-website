package com.healthcare.clinic.reception.service;

import com.healthcare.clinic.appointment.dto.AppointmentResponseDto;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.billing.entity.Invoice;
import com.healthcare.clinic.billing.entity.InvoiceStatus;
import com.healthcare.clinic.billing.repository.InvoiceRepository;
import com.healthcare.clinic.patient.entity.PatientDocument;
import com.healthcare.clinic.patient.repository.PatientDocumentRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.reception.entity.KioskCheckin;
import com.healthcare.clinic.reception.entity.ReceptionDocumentUpload;
import com.healthcare.clinic.reception.entity.WalkInRegistration;
import com.healthcare.clinic.reception.repository.KioskCheckinRepository;
import com.healthcare.clinic.reception.repository.QueueTokenRepository;
import com.healthcare.clinic.reception.repository.ReceptionDocumentUploadRepository;
import com.healthcare.clinic.reception.repository.WalkInRegistrationRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class KioskService {

    private final KioskCheckinRepository kioskCheckinRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final WalkInRegistrationRepository walkInRegistrationRepository;
    private final QueueTokenRepository queueTokenRepository;
    private final PatientDocumentRepository patientDocumentRepository;
    private final ReceptionDocumentUploadRepository receptionDocumentUploadRepository;
    private final InvoiceRepository invoiceRepository;

    /**
     * Patient self-checks in via kiosk — verifies appointment and creates kiosk record.
     */
    @Transactional
    public KioskCheckin selfCheckIn(Long branchId, Long patientProfileId, Long appointmentId, String station) {
        KioskCheckin checkin = KioskCheckin.builder()
                .branchId(branchId)
                .patientId(patientProfileId)
                .appointmentId(appointmentId)
                .checkinMethod("KIOSK")
                .status("PENDING")
                .kioskStation(station)
                .build();
        return kioskCheckinRepository.save(checkin);
    }

    /**
     * Reception staff verifies a kiosk check-in.
     */
    @Transactional
    public KioskCheckin verifyCheckin(Long checkinId, String newStatus) {
        KioskCheckin checkin = kioskCheckinRepository.findById(checkinId)
                .orElseThrow(() -> new RuntimeException("Kiosk check-in not found"));
        checkin.setStatus(newStatus);
        checkin.setVerifiedAt(ZonedDateTime.now());
        checkin.setVerifiedByStaff(SecurityUtils.getCurrentUserId());
        return kioskCheckinRepository.save(checkin);
    }

    /**
     * Get today's kiosk check-ins for a branch.
     */
    public List<KioskCheckin> getTodaysCheckins(Long branchId) {
        ZonedDateTime startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault());
        return kioskCheckinRepository.findByBranchIdAndCreatedAtAfterOrderByCreatedAtDesc(branchId, startOfDay);
    }

    /**
     * Upload a document on behalf of a patient (reception desk scanning).
     */
    @Transactional
    public PatientDocument uploadDocumentForPatient(Long patientProfileId, Long branchId,
                                                     String title, String documentType,
                                                     String fileUrl, String scanDevice, String notes) {
        PatientDocument document = new PatientDocument();
        document.setPatientId(patientProfileId);
        document.setTitle(title);
        document.setDocumentType(documentType);
        document.setFileUrl(fileUrl != null ? fileUrl : "https://placeholder.documents/scan.pdf");
        PatientDocument saved = patientDocumentRepository.save(document);

        // Audit trail
        ReceptionDocumentUpload audit = ReceptionDocumentUpload.builder()
                .patientDocumentId(saved.getId())
                .uploadedByStaffId(SecurityUtils.getCurrentUserId())
                .branchId(branchId)
                .scanDevice(scanDevice)
                .notes(notes)
                .build();
        receptionDocumentUploadRepository.save(audit);

        return saved;
    }

    /**
     * Get all documents for a patient (for display on reception desk).
     */
    public List<PatientDocument> getPatientDocuments(Long patientProfileId) {
        return patientDocumentRepository.findByPatientIdOrderByUploadedAtDesc(patientProfileId);
    }

    /**
     * Get real-time dashboard stats for a branch.
     */
    public Map<String, Object> getDashboardStats(Long branchId) {
        LocalDateTime startOfDayLocal = LocalDate.now().atStartOfDay();
        ZonedDateTime startOfDay = startOfDayLocal.atZone(ZoneId.systemDefault());

        long kioskPending = kioskCheckinRepository.countByBranchIdAndStatusAndCreatedAtAfter(branchId, "PENDING", startOfDay);
        long kioskVerified = kioskCheckinRepository.countByBranchIdAndStatusAndCreatedAtAfter(branchId, "VERIFIED", startOfDay);
        long kioskCheckedIn = kioskCheckinRepository.countByBranchIdAndStatusAndCreatedAtAfter(branchId, "CHECKED_IN", startOfDay);

        List<WalkInRegistration> walkIns = walkInRegistrationRepository.findByBranchId(branchId);
        long walkInToday = walkIns.stream()
                .filter(w -> w.getRegisteredAt() != null
                        && w.getBranch() != null
                        && w.getBranch().getId().equals(branchId)
                        && w.getRegisteredAt().isAfter(startOfDay))
                .count();

        long queueWaiting = queueTokenRepository.countByBranchIdAndStatus(branchId, "WAITING");

        ZonedDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
        List<AppointmentResponseDto> todayAppts = appointmentRepository.findAllAppointmentsToday(startOfDay, endOfDay);
        long todayAppointments = todayAppts.size();
        long completedAppointments = todayAppts.stream()
                .filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus())).count();
        long cancelledAppointments = todayAppts.stream()
                .filter(a -> "CANCELLED".equalsIgnoreCase(a.getStatus())).count();
        long checkedInAppointments = todayAppts.stream()
                .filter(a -> "CHECKED_IN".equalsIgnoreCase(a.getStatus()) || "IN_CONSULTATION".equalsIgnoreCase(a.getStatus())).count();

        List<Invoice> branchInvoices = invoiceRepository.findByBranchIdOrderByCreatedAtDesc(branchId);
        long pendingPaymentsCount = branchInvoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.ISSUED 
                          || i.getStatus() == InvoiceStatus.PARTIALLY_PAID
                          || (i.getOutstandingBalance() != null && i.getOutstandingBalance().compareTo(BigDecimal.ZERO) > 0))
                .count();
        BigDecimal todayCollection = branchInvoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.PAID && i.getPaidAt() != null && !i.getPaidAt().isBefore(startOfDayLocal))
                .map(i -> i.getTotalAmount() != null ? i.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> stats = new HashMap<>();
        stats.put("kioskPending", kioskPending);
        stats.put("kioskVerified", kioskVerified);
        stats.put("kioskCheckedIn", kioskCheckedIn);
        stats.put("walkInsToday", walkInToday);
        stats.put("queueWaiting", queueWaiting);
        stats.put("totalKioskToday", kioskPending + kioskVerified + kioskCheckedIn);
        stats.put("todayAppointments", todayAppointments);
        stats.put("completedAppointments", completedAppointments);
        stats.put("cancelledAppointments", cancelledAppointments);
        stats.put("checkedInPatients", Math.max(kioskCheckedIn, checkedInAppointments));
        stats.put("pendingPayments", pendingPaymentsCount);
        stats.put("todayCollection", todayCollection);
        return stats;
    }
}
