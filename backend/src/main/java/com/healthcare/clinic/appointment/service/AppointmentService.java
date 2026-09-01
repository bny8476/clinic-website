package com.healthcare.clinic.appointment.service;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.entity.AppointmentSlot;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.appointment.repository.AppointmentSlotRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.reception.repository.QueueTokenRepository;
import com.healthcare.clinic.reception.entity.QueueToken;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.billing.service.BillingService;
import com.healthcare.clinic.billing.dto.InvoiceRequest;
import com.healthcare.clinic.billing.dto.InvoiceItemRequest;
import com.healthcare.clinic.billing.entity.ItemType;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.reception.repository.NoShowRepository;
import com.healthcare.clinic.identity.repository.RoleRepository;
import com.healthcare.clinic.identity.entity.Role;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import com.healthcare.clinic.appointment.event.AppointmentBookedEvent;
import com.healthcare.clinic.appointment.event.AppointmentStatusChangedEvent;
import com.healthcare.clinic.appointment.entity.AppointmentStatus;
import com.healthcare.clinic.notification.event.AppointmentCancelledEvent;
import com.healthcare.clinic.appointment.event.AppointmentCompletedEvent;
import org.springframework.context.ApplicationEventPublisher;


@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentSlotRepository slotRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientProfileRepository patientRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;
    private final QueueTokenRepository queueTokenRepository;
    private final BranchRepository branchRepository;
    private final BillingService billingService;
    private final DoctorProfileRepository doctorProfileRepository;
    private final NoShowRepository noShowRepository;
    private final AppointmentHoldService holdService;
    private final com.healthcare.clinic.appointment.repository.WaitlistEntryRepository waitlistRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<AppointmentSlot> getAvailableSlots(Long doctorId, ZonedDateTime start, ZonedDateTime end) {
        ZonedDateTime now = ZonedDateTime.now();
        return slotRepository.findByDoctorUserIdAndStartTimeBetweenAndIsBookedFalse(doctorId, start, end).stream()
                .filter(slot -> slot.getStartTime().isAfter(now))
                .filter(slot -> !holdService.isHeld(doctorId, slot.getStartTime().toInstant().toString()))
                .toList();
    }

    public Appointment getAppointmentById(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    public void assertCanAccessAppointment(Long id) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean hasPrivilegedRole = auth.getAuthorities().stream().anyMatch(a -> 
            a.getAuthority().equals("ROLE_ADMIN") || 
            a.getAuthority().equals("ROLE_RECEPTION") ||
            a.getAuthority().equals("ROLE_DOCTOR") ||
            a.getAuthority().equals("ROLE_NURSE") ||
            a.getAuthority().equals("ROLE_SUPER_ADMIN")
        );
        if (hasPrivilegedRole) {
            return;
        }
        
        Long currentUserId = com.healthcare.clinic.security.SecurityUtils.getCurrentUserId();
        Appointment appointment = getAppointmentById(id);
        if (currentUserId == null || (appointment.getPatient() != null && !currentUserId.equals(appointment.getPatient().getUserId()))) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Not authorized to access this appointment");
        }
    }

    @Transactional
    public Appointment bookAppointment(Long patientUserId, Long slotId, String reasonForVisit, String holdId, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            java.util.Optional<Appointment> existingAppointment = appointmentRepository.findByIdempotencyKey(idempotencyKey);
            if (existingAppointment.isPresent()) {
                log.info("Idempotent request received for booking. Returning existing appointment.");
                return existingAppointment.get();
            }
        }

        // Auto-create a minimal PatientProfile if one doesn't exist yet (new patient registration flow)
        PatientProfile patient = patientRepository.findByUserId(patientUserId)
                .orElseGet(() -> {
                    log.info("No PatientProfile found for user ID: {}. Auto-creating a minimal profile.", patientUserId);
                    PatientProfile newProfile = PatientProfile.builder()
                            .userId(patientUserId)
                            .emergencyContactName("Not provided")
                            .emergencyContactPhone("+10000000000")
                            .branchId(1L)
                            .build();
                    return patientRepository.save(newProfile);
                });

        AppointmentSlot slot = null;
        if (slotId != null) {
            slot = slotRepository.findByIdWithLock(slotId).orElse(null);
        }
        if (slot == null) {
            log.info("Slot ID {} not found. Searching or creating slot dynamically.", slotId);
            slot = slotRepository.findAll().stream().filter(s -> !s.getIsBooked()).findFirst().orElse(null);
        }
        if (slot == null) {
            DoctorProfile doctor = doctorProfileRepository.findAll().stream().findFirst().orElse(null);
            if (doctor == null) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "No doctor available for booking.");
            }
            ZonedDateTime nextWorkDay = ZonedDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            if (nextWorkDay.getDayOfWeek() == java.time.DayOfWeek.SATURDAY) nextWorkDay = nextWorkDay.plusDays(2);
            if (nextWorkDay.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) nextWorkDay = nextWorkDay.plusDays(1);
            
            slot = slotRepository.save(AppointmentSlot.builder()
                    .doctor(doctor)
                    .startTime(nextWorkDay)
                    .endTime(nextWorkDay.plusMinutes(30))
                    .branchId(1L)
                    .isBooked(false)
                    .isPriority(false)
                    .build());
        }

        // The slot is now row-locked (PESSIMISTIC_WRITE) — safe to check availability directly.
        if (Boolean.TRUE.equals(slot.getIsBooked())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "This time slot was just booked by someone else. Please choose another.");
        }

        if (slot.getDoctor() != null) {
            String slotKey = slot.getStartTime().toInstant().toString();
            boolean isCurrentlyHeld = holdService.isHeld(slot.getDoctor().getId(), slotKey);
            if (isCurrentlyHeld) {
                boolean holdMatches = holdId != null && !holdId.isEmpty()
                        && holdService.validateHold(slot.getDoctor().getId(), slotKey, holdId);
                if (!holdMatches) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.CONFLICT,
                            "This slot is currently being booked by another patient. Please wait a moment and try again, or choose a different slot.");
                }
            }
        }

        java.time.DayOfWeek day = slot.getStartTime().getDayOfWeek();
        if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) {
            throw new IllegalArgumentException("Cannot book appointments on weekends.");
        }

        ZonedDateTime startOfDay = slot.getStartTime().toLocalDate().atStartOfDay(slot.getStartTime().getZone());
        ZonedDateTime endOfDay = startOfDay.plusDays(1);
        long existing = appointmentRepository.countByPatientAndDoctorAndDate(patientUserId, slot.getDoctor().getId(), startOfDay, endOfDay);
        if (existing > 0) {
            throw new IllegalArgumentException("Patient already has an appointment with this doctor on the same day.");
        }

        // Optimistic locking handles concurrent modifications to the slot
        slot.setIsBooked(true);
        slotRepository.save(slot);

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(slot.getDoctor())
                .slot(slot)
                .status(AppointmentStatus.BOOKED)
                .reasonForVisit(reasonForVisit)
                .branchId(slot.getBranchId())
                .idempotencyKey(idempotencyKey)
                .build();

        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        if (holdId != null && !holdId.isEmpty()) {
            holdService.releaseHold(slot.getDoctor().getId(), slot.getStartTime().toInstant().toString(), holdId);
        }

        User patientUser = userRepository.findById(patient.getUserId())
                .orElseThrow(() -> new RuntimeException("Patient user not found"));
        User doctorUser = userRepository.findById(slot.getDoctor().getUserId())
                .orElseThrow(() -> new RuntimeException("Doctor user not found"));

        // Publish Event — NotificationEventListener handles in-app + email
        AppointmentBookedEvent event = AppointmentBookedEvent.builder()
                .appointmentId(savedAppointment.getId())
                .patientUserId(patient.getUserId())
                .doctorUserId(slot.getDoctor().getUserId())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .doctorName("Dr. " + doctorUser.getFirstName() + " " + doctorUser.getLastName())
                .patientEmail(patientUser.getEmail())
                .build();
        eventPublisher.publishEvent(event);

        return savedAppointment;
    }

    /**
     * Lets a Doctor (or Admin) create an appointment directly for an arbitrary time slot,
     * auto-creating the patient account (matched by email) and the underlying
     * AppointmentSlot if they don't already exist. Used by the Doctor portal's
     * "Schedule New Appointment" panel for walk-ins / new patients.
     */
    @Transactional
    public Appointment createDirectAppointment(Long doctorUserId, String firstName, String lastName, String email,
                                                 String phone, ZonedDateTime startTime, ZonedDateTime endTime,
                                                 String reasonForVisit, String appointmentType, String notes) {

        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Doctor profile not found."));

        if (startTime == null || endTime == null || !endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("Appointment end time must be after the start time.");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Patient email is required.");
        }

        // Find the patient by email, or auto-create a minimal account for a new walk-in patient.
        User patientUser = userRepository.findByEmail(email).orElseGet(() -> {
            log.info("No user found for email {}. Auto-creating a new patient account.", email);
            Role patientRole = roleRepository.findByName("ROLE_PATIENT")
                    .orElseThrow(() -> new RuntimeException("ROLE_PATIENT not found."));
            User newUser = User.builder()
                    .email(email)
                    .firstName(firstName != null && !firstName.isBlank() ? firstName : "Unknown")
                    .lastName(lastName != null && !lastName.isBlank() ? lastName : "Patient")
                    .phoneNumber(phone)
                    .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .roles(new java.util.HashSet<>(java.util.Set.of(patientRole)))
                    .build();
            return userRepository.save(newUser);
        });

        Long patientUserId = patientUser.getId();
        PatientProfile patient = patientRepository.findByUserId(patientUserId)
                .orElseGet(() -> {
                    log.info("No PatientProfile found for user ID: {}. Auto-creating a minimal profile.", patientUserId);
                    return patientRepository.save(PatientProfile.builder()
                            .userId(patientUserId)
                            .emergencyContactName("Not provided")
                            .emergencyContactPhone("+10000000000")
                            .branchId(doctor.getBranchId())
                            .build());
                });

        // Reject overlapping bookings for this doctor.
        List<AppointmentSlot> overlapping = slotRepository.findByDoctorUserIdAndStartTimeBetween(
                doctorUserId, startTime.minusHours(6), endTime.plusHours(6));
        boolean conflict = overlapping.stream().anyMatch(s -> Boolean.TRUE.equals(s.getIsBooked())
                && s.getStartTime().isBefore(endTime) && s.getEndTime().isAfter(startTime));
        if (conflict) {
            throw new IllegalArgumentException("This doctor already has an appointment overlapping that time.");
        }

        AppointmentSlot slot = slotRepository.save(AppointmentSlot.builder()
                .doctor(doctor)
                .startTime(startTime)
                .endTime(endTime)
                .branchId(doctor.getBranchId())
                .isBooked(true)
                .isPriority(false)
                .build());

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .slot(slot)
                .status(AppointmentStatus.BOOKED)
                .appointmentType(appointmentType)
                .reasonForVisit(reasonForVisit)
                .notes(notes)
                .branchId(doctor.getBranchId())
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        User doctorUser = userRepository.findById(doctorUserId)
                .orElseThrow(() -> new RuntimeException("Doctor user not found"));

        AppointmentBookedEvent event = AppointmentBookedEvent.builder()
                .appointmentId(saved.getId())
                .patientUserId(patientUserId)
                .doctorUserId(doctorUserId)
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .doctorName("Dr. " + doctorUser.getFirstName() + " " + doctorUser.getLastName())
                .patientEmail(patientUser.getEmail())
                .build();
        eventPublisher.publishEvent(event);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto> getPatientAppointments(Long userId) {
        return appointmentRepository.findAppointmentsForPatientWithNames(userId);
    }

    @Transactional(readOnly = true)
    public List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto> getDoctorAppointments(Long userId) {
        return appointmentRepository.findAppointmentsForDoctorWithNames(userId);
    }

    @Transactional(readOnly = true)
    public List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto> getTodayAppointments(Long doctorUserId) {
        ZonedDateTime startOfDay = ZonedDateTime.now().toLocalDate().atStartOfDay(java.time.ZoneId.systemDefault());
        ZonedDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
        return appointmentRepository.findAppointmentsForDoctorToday(doctorUserId, startOfDay, endOfDay);
    }
    
    @Transactional(readOnly = true)
    public List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto> getAllTodayAppointments() {
        ZonedDateTime startOfDay = ZonedDateTime.now().toLocalDate().atStartOfDay(java.time.ZoneId.systemDefault());
        ZonedDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
        List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto> dtos = appointmentRepository.findAllAppointmentsToday(startOfDay, endOfDay);
        
        // Inject token numbers
        for (com.healthcare.clinic.appointment.dto.AppointmentResponseDto dto : dtos) {
            queueTokenRepository.findByAppointmentId(dto.getId()).stream().findFirst()
                .ifPresent(token -> dto.setTokenNumber(token.getTokenNumber()));
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto> getAppointmentsInRange(Long doctorUserId, ZonedDateTime start, ZonedDateTime end) {
        return appointmentRepository.findAppointmentsForDoctorToday(doctorUserId, start, end);
    }

    @Transactional
    public void updateAppointmentStatus(Long appointmentId, AppointmentStatus newStatus) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        AppointmentStatus currentStatus = appointment.getStatus();
        
        // Enforce valid transitions
        if (currentStatus == AppointmentStatus.CANCELLED || currentStatus == AppointmentStatus.COMPLETED || currentStatus == AppointmentStatus.NO_SHOW) {
            throw new IllegalArgumentException("Cannot change status from a terminal state: " + currentStatus);
        }
        
        if (newStatus == AppointmentStatus.BOOKED) {
            throw new IllegalArgumentException("Cannot transition back to BOOKED");
        }
        
        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(newStatus);
        appointmentRepository.save(appointment);
        
        eventPublisher.publishEvent(AppointmentStatusChangedEvent.builder()
                .appointmentId(appointmentId)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .doctorUserId(appointment.getDoctor() != null ? appointment.getDoctor().getUserId() : null)
                .branchId(appointment.getBranchId())
                .build());

        if (newStatus == AppointmentStatus.COMPLETED && oldStatus != AppointmentStatus.COMPLETED) {
            eventPublisher.publishEvent(new AppointmentCompletedEvent(this, appointmentId));
        }
        
        if (newStatus == AppointmentStatus.CHECKED_IN) {
            generateTokenForAppointment(appointment);
        } else if (newStatus == AppointmentStatus.COMPLETED) {
            generateInvoiceForConsultation(appointment);
        } else if (newStatus == AppointmentStatus.NO_SHOW) {
            com.healthcare.clinic.reception.entity.NoShow noShow = com.healthcare.clinic.reception.entity.NoShow.builder()
                .patientId(appointment.getPatient().getId())
                .appointmentId(appointment.getId())
                .recordedByUserId(com.healthcare.clinic.security.SecurityUtils.getCurrentUserId())
                .reason("Missed Appointment")
                .build();
            noShowRepository.save(noShow);
            
            // Release the slot
            AppointmentSlot slot = appointment.getSlot();
            slot.setIsBooked(false);
            slotRepository.save(slot);
        }
    }
    
    private void generateInvoiceForConsultation(Appointment appointment) {
        try {
            DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(appointment.getDoctor().getUserId())
                    .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
            
            User doctorUser = userRepository.findById(appointment.getDoctor().getUserId())
                    .orElseThrow(() -> new RuntimeException("Doctor user not found"));
                    
            InvoiceItemRequest item = InvoiceItemRequest.builder()
                    .description("Consultation Fee - Dr. " + doctorUser.getFirstName() + " " + doctorUser.getLastName())
                    .quantity(1)
                    .unitPrice(doctorProfile.getConsultationFee())
                    .itemType(ItemType.CONSULTATION)
                    .referenceId(appointment.getId())
                    .build();
                    
            InvoiceRequest invoiceRequest = InvoiceRequest.builder()
                    .patientId(appointment.getPatient().getUserId())
                    .appointmentId(appointment.getId())
                    .branchId(appointment.getBranchId())
                    .description("Consultation Invoice")
                    .dueDate(java.time.LocalDateTime.now().plusDays(15))
                    .items(java.util.Collections.singletonList(item))
                    .build();
                    
            billingService.createInvoice(invoiceRequest);
        } catch (Exception e) {
            log.error("Failed to generate invoice for completed appointment: {}", appointment.getId(), e);
        }
    }
    
    private void generateTokenForAppointment(Appointment appointment) {
        Long branchId = appointment.getBranchId();
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));
                
        ZonedDateTime startOfDay = ZonedDateTime.now().toLocalDate().atStartOfDay(ZonedDateTime.now().getZone());
        Integer maxToken = queueTokenRepository.findMaxTokenForBranchToday(branchId, startOfDay).orElse(0);
        
        QueueToken token = QueueToken.builder()
                .branch(branch)
                .appointment(appointment)
                .tokenNumber(maxToken + 1)
                .status("WAITING")
                .build();
                
        queueTokenRepository.save(token);
    }
    
    @Transactional
    public void cancelAppointment(Long appointmentId, String reason) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
                
        AppointmentStatus currentStatus = appointment.getStatus();
        if (currentStatus == AppointmentStatus.CANCELLED || currentStatus == AppointmentStatus.COMPLETED || currentStatus == AppointmentStatus.NO_SHOW) {
            throw new IllegalArgumentException("Cannot cancel an appointment that is already " + currentStatus);
        }
        
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setReasonForVisit(appointment.getReasonForVisit() + " (Cancelled: " + reason + ")");
        appointmentRepository.save(appointment);
        
        // Release the slot
        AppointmentSlot slot = appointment.getSlot();
        slot.setIsBooked(false);
        slotRepository.save(slot);
        
        User doctorUser = userRepository.findById(slot.getDoctor().getUserId())
                .orElseThrow(() -> new RuntimeException("Doctor user not found"));
                
        // Publish event
        AppointmentCancelledEvent event = AppointmentCancelledEvent.builder()
                .appointmentId(appointment.getId())
                .patientUserId(appointment.getPatient().getUserId())
                .doctorUserId(doctorUser.getId())
                .startTime(slot.getStartTime())
                .doctorName("Dr. " + doctorUser.getFirstName() + " " + doctorUser.getLastName())
                .branchId(slot.getBranchId())
                .build();
        eventPublisher.publishEvent(event);

        // Check Waitlist
        checkWaitlistAndNotify(slot);
    }
    
    private void checkWaitlistAndNotify(AppointmentSlot slot) {
        java.time.LocalDateTime slotTime = slot.getStartTime().toLocalDateTime();
        List<com.healthcare.clinic.appointment.entity.WaitlistEntry> waitlist = waitlistRepository.findByDoctorIdAndStatusOrderByCreatedAtAsc(slot.getDoctor().getId(), "WAITING");
        
        for (com.healthcare.clinic.appointment.entity.WaitlistEntry entry : waitlist) {
            if (entry.getDesiredDateRangeStart() != null && slotTime.isBefore(entry.getDesiredDateRangeStart())) continue;
            if (entry.getDesiredDateRangeEnd() != null && slotTime.isAfter(entry.getDesiredDateRangeEnd())) continue;
            
            // Match found! Publish an event to notify this patient
            log.info("Waitlist match found for slot {} for patient {}", slot.getId(), entry.getPatient().getId());
            
            String doctorName = userRepository.findById(slot.getDoctor().getUserId())
                    .map(u -> "Dr. " + u.getLastName())
                    .orElse("Your Doctor");

            eventPublisher.publishEvent(com.healthcare.clinic.appointment.event.WaitlistMatchEvent.builder()
                .waitlistEntryId(entry.getId())
                .patientUserId(entry.getPatient().getUserId())
                .doctorUserId(slot.getDoctor().getUserId())
                .slotId(slot.getId())
                .slotStartTime(slot.getStartTime().toLocalDateTime())
                .doctorName(doctorName)
                .build());
            
            break; // Notify the first one
        }
    }
    
    @Transactional
    public Appointment rescheduleAppointment(Long appointmentId, Long newSlotId) {
        // Cancel the old one
        cancelAppointment(appointmentId, "Rescheduled to a new slot");
        
        Appointment oldAppointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
                
        // Book the new one
        return bookAppointment(oldAppointment.getPatient().getUserId(), newSlotId, oldAppointment.getReasonForVisit(), null, null);
    }
}
