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
    private final com.healthcare.clinic.appointment.repository.AppointmentAuditLogRepository auditLogRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.healthcare.clinic.doctor.service.DoctorScheduleService doctorScheduleService;
    private final com.healthcare.clinic.doctor.repository.ClinicalEncounterRepository encounterRepository;

    @Transactional
    public List<AppointmentSlot> getAvailableSlots(Long doctorId, ZonedDateTime start, ZonedDateTime end) {
        DoctorProfile doctor = doctorProfileRepository.findById(doctorId)
                .orElseGet(() -> doctorProfileRepository.findByUserId(doctorId).orElse(null));

        Long userId = doctor != null ? doctor.getUserId() : doctorId;

        java.time.LocalDate startDate = start.toLocalDate();
        java.time.LocalDate endDate = end.toLocalDate();

        List<AppointmentSlot> existingSlots = new java.util.ArrayList<>(slotRepository.findByDoctorUserIdAndStartTimeBetween(userId, start, end));
        if (doctor != null && doctor.getId() != null) {
            List<AppointmentSlot> profileSlots = slotRepository.findByDoctorIdAndStartTimeBetween(doctor.getId(), start, end);
            for (AppointmentSlot s : profileSlots) {
                if (existingSlots.stream().noneMatch(x -> x.getId().equals(s.getId()))) {
                    existingSlots.add(s);
                }
            }
        }

        if (existingSlots.isEmpty() && doctor != null) {
            doctorScheduleService.generateSlotsForRange(userId, startDate, endDate);
            existingSlots = new java.util.ArrayList<>(slotRepository.findByDoctorUserIdAndStartTimeBetween(userId, start, end));
        }

        if (existingSlots.isEmpty() && doctor != null) {
            for (java.time.LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
                generateFallbackSlotsForDate(doctor, d);
            }
            existingSlots = new java.util.ArrayList<>(slotRepository.findByDoctorUserIdAndStartTimeBetween(userId, start, end));
        }

        ZonedDateTime now = ZonedDateTime.now();
        return existingSlots.stream()
                .filter(slot -> Boolean.FALSE.equals(slot.getIsBooked()))
                .filter(slot -> slot.getStartTime().isAfter(now.minusMinutes(10)))
                .filter(slot -> !holdService.isHeld(userId, slot.getStartTime().toInstant().toString()))
                .sorted(java.util.Comparator.comparing(AppointmentSlot::getStartTime))
                .toList();
    }

    @Transactional
    public List<java.util.Map<String, Object>> getAvailableSlotsForDoctorAndDate(Long doctorId, java.time.LocalDate date) {
        DoctorProfile doctor = doctorProfileRepository.findById(doctorId)
                .orElseGet(() -> doctorProfileRepository.findByUserId(doctorId).orElse(null));

        if (doctor == null) {
            log.warn("getAvailableSlotsForDoctorAndDate: Doctor profile not found for ID {}", doctorId);
            return java.util.Collections.emptyList();
        }

        Long userId = doctor.getUserId();
        java.time.ZoneId zone = java.time.ZoneId.systemDefault();
        ZonedDateTime startOfDay = date.atStartOfDay(zone);
        ZonedDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);

        List<AppointmentSlot> existingSlots = slotRepository.findByDoctorUserIdAndStartTimeBetween(userId, startOfDay, endOfDay);

        if (existingSlots.isEmpty()) {
            doctorScheduleService.generateSlotsForRange(userId, date, date);
            existingSlots = slotRepository.findByDoctorUserIdAndStartTimeBetween(userId, startOfDay, endOfDay);
        }

        if (existingSlots.isEmpty()) {
            generateFallbackSlotsForDate(doctor, date);
            existingSlots = slotRepository.findByDoctorUserIdAndStartTimeBetween(userId, startOfDay, endOfDay);
        }

        ZonedDateTime now = ZonedDateTime.now(zone);
        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("hh:mm a");

        return existingSlots.stream()
                .filter(slot -> Boolean.FALSE.equals(slot.getIsBooked()))
                .filter(slot -> !date.isEqual(java.time.LocalDate.now(zone)) || slot.getEndTime().isAfter(now.minusMinutes(10)))
                .sorted(java.util.Comparator.comparing(AppointmentSlot::getStartTime))
                .map(slot -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", slot.getId());
                    map.put("startTime", slot.getStartTime().toString());
                    map.put("endTime", slot.getEndTime().toString());
                    map.put("label", slot.getStartTime().format(timeFormatter));
                    map.put("isBooked", slot.getIsBooked());
                    map.put("isPriority", slot.getIsPriority() != null ? slot.getIsPriority() : false);
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    private void generateFallbackSlotsForDate(DoctorProfile doctor, java.time.LocalDate date) {
        java.time.ZoneId zone = java.time.ZoneId.systemDefault();
        java.time.LocalTime current = java.time.LocalTime.of(9, 0);
        java.time.LocalTime end = java.time.LocalTime.of(17, 0);
        int duration = 20;

        while (current.plusMinutes(duration).isBefore(end) || current.plusMinutes(duration).equals(end)) {
            ZonedDateTime slotStart = ZonedDateTime.of(date, current, zone);
            ZonedDateTime slotEnd = slotStart.plusMinutes(duration);

            AppointmentSlot slot = AppointmentSlot.builder()
                    .doctor(doctor)
                    .startTime(slotStart)
                    .endTime(slotEnd)
                    .isBooked(false)
                    .branchId(doctor.getBranchId() != null ? doctor.getBranchId() : 1L)
                    .build();
            slotRepository.save(slot);

            current = current.plusMinutes(duration);
        }
    }

    public Appointment getAppointmentById(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    private String generateAppointmentNumber() {
        String dateStr = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomSuffix = java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "APT-" + dateStr + "-" + randomSuffix;
    }

    private void recordAudit(Appointment appointment, String action, AppointmentStatus oldStatus, AppointmentStatus newStatus, String notes) {
        try {
            Long performedBy = com.healthcare.clinic.security.SecurityUtils.getCurrentUserId();
            if (performedBy == null && appointment.getPatient() != null) {
                performedBy = appointment.getPatient().getUserId();
            }
            com.healthcare.clinic.appointment.entity.AppointmentAuditLog auditLog = com.healthcare.clinic.appointment.entity.AppointmentAuditLog.builder()
                    .appointmentId(appointment.getId())
                    .action(action)
                    .oldStatus(oldStatus != null ? oldStatus.name() : null)
                    .newStatus(newStatus != null ? newStatus.name() : null)
                    .performedById(performedBy)
                    .reason(notes)
                    .createdAt(java.time.ZonedDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to record appointment audit log for appointment {}", appointment.getId(), e);
        }
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
    public Appointment bookAppointmentFromRequest(com.healthcare.clinic.appointment.dto.BookingRequest request, String idempotencyKey) {
        Long slotId = request.getParsedSlotId();
        Long patientUserId = request.getPatientUserId();
        String reasonForVisit = request.getReasonForVisit();
        if (reasonForVisit == null || reasonForVisit.isBlank()) {
            reasonForVisit = request.getNotes();
        }
        if (reasonForVisit == null || reasonForVisit.isBlank()) {
            reasonForVisit = "Routine Consultation & Checkup";
        }

        if (patientUserId == null && request.getPatientId() != null) {
            PatientProfile p = patientRepository.findById(request.getPatientId()).orElse(null);
            if (p != null) {
                patientUserId = p.getUserId();
            }
        }

        // Auto-resolve or create patient profile if not explicitly specified by ID
        if (patientUserId == null && (request.getPatientEmail() != null || request.getPatientPhone() != null || request.getPatientFirstName() != null)) {
            User existingUser = null;
            if (request.getPatientEmail() != null && !request.getPatientEmail().isBlank()) {
                existingUser = userRepository.findByEmail(request.getPatientEmail().trim()).orElse(null);
            }
            if (existingUser == null && request.getPatientPhone() != null && !request.getPatientPhone().isBlank()) {
                existingUser = userRepository.findByPhoneNumber(request.getPatientPhone().trim()).orElse(null);
            }

            if (existingUser != null) {
                patientUserId = existingUser.getId();
            } else {
                String email = (request.getPatientEmail() != null && !request.getPatientEmail().isBlank())
                        ? request.getPatientEmail().trim()
                        : "patient_" + System.currentTimeMillis() + "@clinic.local";
                String firstName = (request.getPatientFirstName() != null && !request.getPatientFirstName().isBlank())
                        ? request.getPatientFirstName().trim()
                        : "Patient";
                String lastName = request.getPatientLastName() != null ? request.getPatientLastName().trim() : "";

                User newPatientUser = User.builder()
                        .email(email)
                        .firstName(firstName)
                        .lastName(lastName)
                        .phoneNumber(request.getPatientPhone())
                        .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                        .enabled(true)
                        .build();
                newPatientUser = userRepository.save(newPatientUser);

                PatientProfile newPatient = PatientProfile.builder()
                        .userId(newPatientUser.getId())
                        .emergencyContactName("Not provided")
                        .emergencyContactPhone(request.getPatientPhone() != null ? request.getPatientPhone() : "+10000000000")
                        .branchId(1L)
                        .build();
                newPatient = patientRepository.save(newPatient);
                patientUserId = newPatientUser.getId();
            }
        }

        if (slotId == null) {
            Long docId = request.getDoctorId();
            DoctorProfile doctor = null;
            if (docId != null) {
                doctor = doctorProfileRepository.findById(docId)
                        .orElseGet(() -> doctorProfileRepository.findByUserId(docId).orElse(null));
            }
            if (doctor == null) {
                Long currentUserId = com.healthcare.clinic.security.SecurityUtils.getCurrentUserId();
                if (currentUserId != null) {
                    doctor = doctorProfileRepository.findByUserId(currentUserId).orElse(null);
                }
            }

            if (doctor != null) {
                ZonedDateTime startZdt = parseDateTime(request.getStartTime(), request.getAppointmentDate());
                List<AppointmentSlot> existingSlots = slotRepository.findByDoctorUserIdAndStartTimeBetween(doctor.getUserId(), startZdt.minusMinutes(1), startZdt.plusMinutes(1));
                if (existingSlots.isEmpty() && doctor.getId() != null) {
                    existingSlots = slotRepository.findByDoctorIdAndStartTimeBetween(doctor.getId(), startZdt.minusMinutes(1), startZdt.plusMinutes(1));
                }

                AppointmentSlot unbookedSlot = existingSlots.stream()
                        .filter(s -> Boolean.FALSE.equals(s.getIsBooked()) && !appointmentRepository.existsBySlotId(s.getId()))
                        .findFirst()
                        .orElse(null);

                if (unbookedSlot != null) {
                    slotId = unbookedSlot.getId();
                } else {
                    ZonedDateTime endZdt = request.getEndTime() != null ? parseDateTime(request.getEndTime(), request.getAppointmentDate()) : startZdt.plusMinutes(30);
                    AppointmentSlot newSlot = AppointmentSlot.builder()
                            .doctor(doctor)
                            .startTime(startZdt)
                            .endTime(endZdt)
                            .isBooked(false)
                            .branchId(doctor.getBranchId() != null ? doctor.getBranchId() : 1L)
                            .build();
                    newSlot = slotRepository.save(newSlot);
                    slotId = newSlot.getId();
                }
            }
        }

        return bookAppointment(patientUserId, slotId, reasonForVisit, request.getHoldId(), idempotencyKey);
    }

    private ZonedDateTime parseDateTime(String timeStr, String dateStr) {
        if (timeStr == null || timeStr.isBlank()) {
            if (dateStr != null && !dateStr.isBlank()) {
                return java.time.LocalDate.parse(dateStr.trim()).atStartOfDay(java.time.ZoneId.systemDefault());
            }
            return ZonedDateTime.now().plusHours(1);
        }
        timeStr = timeStr.trim();
        try {
            return java.time.Instant.parse(timeStr).atZone(java.time.ZoneId.systemDefault());
        } catch (Exception ignored) {}
        try {
            return ZonedDateTime.parse(timeStr);
        } catch (Exception ignored) {}
        try {
            return java.time.OffsetDateTime.parse(timeStr).toZonedDateTime();
        } catch (Exception ignored) {}
        try {
            java.time.LocalTime time = java.time.LocalTime.parse(timeStr);
            java.time.LocalDate date = (dateStr != null && !dateStr.isBlank()) ? java.time.LocalDate.parse(dateStr.trim()) : java.time.LocalDate.now();
            return ZonedDateTime.of(date, time, java.time.ZoneId.systemDefault());
        } catch (Exception ignored) {}
        try {
            java.time.format.DateTimeFormatter ampmFormatter = new java.time.format.DateTimeFormatterBuilder()
                    .parseCaseInsensitive()
                    .appendPattern("[hh:mm a][h:mm a][hh:mma][h:mma][HH:mm]")
                    .toFormatter(java.util.Locale.ENGLISH);
            java.time.LocalTime time = java.time.LocalTime.parse(timeStr.toUpperCase(), ampmFormatter);
            java.time.LocalDate date = (dateStr != null && !dateStr.isBlank()) ? java.time.LocalDate.parse(dateStr.trim()) : java.time.LocalDate.now();
            return ZonedDateTime.of(date, time, java.time.ZoneId.systemDefault());
        } catch (Exception ignored) {}
        try {
            java.time.LocalDateTime ldt = java.time.LocalDateTime.parse(timeStr);
            return ldt.atZone(java.time.ZoneId.systemDefault());
        } catch (Exception ignored) {}
        return ZonedDateTime.now().plusHours(1);
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

        // Server-Side Patient Authorization: Derive patient identity ONLY if caller is purely a Patient (not staff/doctor/admin)
        Long authUserId = com.healthcare.clinic.security.SecurityUtils.getCurrentUserId();
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authUserId != null && auth != null && auth.getAuthorities() != null) {
            boolean isStaffOrDoctor = auth.getAuthorities().stream().anyMatch(a ->
                    a.getAuthority().equals("ROLE_DOCTOR") ||
                    a.getAuthority().equals("ROLE_RECEPTION") ||
                    a.getAuthority().equals("ROLE_ADMIN") ||
                    a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
                    a.getAuthority().equals("ROLE_NURSE"));
            if (!isStaffOrDoctor && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
                patientUserId = authUserId;
            }
        }
        if (patientUserId == null) {
            patientUserId = authUserId;
        }

        if (patientUserId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "User authentication required to book appointments.");
        }

        final Long finalPatientUserId = patientUserId;
        PatientProfile patient = patientRepository.findByUserId(finalPatientUserId)
                .orElseGet(() -> {
                    log.info("No PatientProfile found for user ID: {}. Auto-creating profile.", finalPatientUserId);
                    PatientProfile newProfile = PatientProfile.builder()
                            .userId(finalPatientUserId)
                            .emergencyContactName("Not provided")
                            .emergencyContactPhone("+10000000000")
                            .branchId(1L)
                            .build();
                    return patientRepository.save(newProfile);
                });

        if (slotId == null) {
            throw new com.healthcare.clinic.appointment.exception.AppointmentConflictException(
                    "APPOINTMENT_SLOT_UNAVAILABLE", "Please select a valid appointment time slot.");
        }

        AppointmentSlot slot = slotRepository.findByIdWithLock(slotId)
                .orElseThrow(() -> new com.healthcare.clinic.appointment.exception.AppointmentConflictException(
                        "APPOINTMENT_SLOT_UNAVAILABLE", "This appointment slot is no longer available. Please choose another time."));

        if (Boolean.TRUE.equals(slot.getIsBooked()) || appointmentRepository.existsBySlotId(slot.getId())) {
            throw new com.healthcare.clinic.appointment.exception.AppointmentConflictException(
                    "APPOINTMENT_SLOT_UNAVAILABLE", "This appointment slot is no longer available. Please select another available time.");
        }

        if (slot.getDoctor() == null) {
            throw new com.healthcare.clinic.appointment.exception.AppointmentConflictException(
                    "DOCTOR_UNAVAILABLE", "The doctor is not available at this time.");
        }

        java.time.DayOfWeek day = slot.getStartTime().getDayOfWeek();
        if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) {
            throw new com.healthcare.clinic.appointment.exception.AppointmentConflictException(
                    "DOCTOR_UNAVAILABLE", "Appointments cannot be booked on weekends.");
        }

        String slotKey = slot.getStartTime().toInstant().toString();
        boolean isCurrentlyHeld = holdService.isHeld(slot.getDoctor().getId(), slotKey);
        if (isCurrentlyHeld) {
            boolean holdMatches = holdId != null && !holdId.isEmpty()
                    && holdService.validateHold(slot.getDoctor().getId(), slotKey, holdId);
            if (!holdMatches) {
                throw new com.healthcare.clinic.appointment.exception.AppointmentConflictException(
                        "APPOINTMENT_SLOT_UNAVAILABLE", "This slot is currently being booked by another patient. Please choose another slot.");
            }
        }

        ZonedDateTime startOfDay = slot.getStartTime().toLocalDate().atStartOfDay(slot.getStartTime().getZone());
        ZonedDateTime endOfDay = startOfDay.plusDays(1);
        long existingCount = appointmentRepository.countByPatientAndDoctorAndDate(finalPatientUserId, slot.getDoctor().getId(), startOfDay, endOfDay);
        if (existingCount > 0) {
            throw new com.healthcare.clinic.appointment.exception.AppointmentConflictException(
                    "DUPLICATE_APPOINTMENT", "You already have an active appointment with this doctor on the selected date.");
        }

        // Reserve slot transactionally
        slot.setIsBooked(true);
        slotRepository.save(slot);

        Appointment appointment = Appointment.builder()
                .appointmentNumber(generateAppointmentNumber())
                .patient(patient)
                .doctor(slot.getDoctor())
                .slot(slot)
                .appointmentDate(slot.getStartTime().toLocalDate())
                .duration((int) java.time.Duration.between(slot.getStartTime(), slot.getEndTime()).toMinutes())
                .status(AppointmentStatus.BOOKED)
                .paymentStatus("PENDING")
                .reasonForVisit(reasonForVisit)
                .branchId(slot.getBranchId() != null ? slot.getBranchId() : 1L)
                .idempotencyKey(idempotencyKey)
                .createdBy(com.healthcare.clinic.security.SecurityUtils.getCurrentUserId() != null ? com.healthcare.clinic.security.SecurityUtils.getCurrentUserId() : finalPatientUserId)
                .build();

        Appointment savedAppointment = appointmentRepository.save(appointment);
        recordAudit(savedAppointment, "BOOKED", null, AppointmentStatus.BOOKED, "Appointment booked for slot " + slot.getId());
        
        if (holdId != null && !holdId.isEmpty()) {
            holdService.releaseHold(slot.getDoctor().getId(), slot.getStartTime().toInstant().toString(), holdId);
        }

        User patientUser = userRepository.findById(patient.getUserId()).orElse(null);
        User doctorUser = (slot.getDoctor() != null) ? userRepository.findById(slot.getDoctor().getUserId()).orElse(null) : null;

        // Publish Event — NotificationEventListener handles in-app + email
        AppointmentBookedEvent event = AppointmentBookedEvent.builder()
                .appointmentId(savedAppointment.getId())
                .patientUserId(patient.getUserId())
                .doctorUserId(slot.getDoctor() != null ? slot.getDoctor().getUserId() : null)
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .doctorName(doctorUser != null ? "Dr. " + doctorUser.getFirstName() + " " + doctorUser.getLastName() : "Doctor")
                .patientEmail(patientUser != null ? patientUser.getEmail() : null)
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
                .appointmentNumber(generateAppointmentNumber())
                .patient(patient)
                .doctor(doctor)
                .slot(slot)
                .appointmentDate(startTime.toLocalDate())
                .duration((int) java.time.Duration.between(startTime, endTime).toMinutes())
                .status(AppointmentStatus.BOOKED)
                .paymentStatus("PENDING")
                .appointmentType(appointmentType)
                .reasonForVisit(reasonForVisit)
                .notes(notes)
                .branchId(doctor.getBranchId())
                .createdBy(com.healthcare.clinic.security.SecurityUtils.getCurrentUserId())
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        recordAudit(saved, "DIRECT_BOOKED", null, AppointmentStatus.BOOKED, "Direct appointment created by staff/doctor");

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
        
        recordAudit(appointment, "STATUS_UPDATE", oldStatus, newStatus, "Status changed from " + oldStatus + " to " + newStatus);
        
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
        
        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledBy(com.healthcare.clinic.security.SecurityUtils.getCurrentUserId());
        appointment.setCancelledAt(ZonedDateTime.now());
        appointment.setCancellationReason(reason);
        appointment.setReasonForVisit(appointment.getReasonForVisit() != null ? appointment.getReasonForVisit() + " (Cancelled: " + reason + ")" : "Cancelled: " + reason);
        appointmentRepository.save(appointment);
        
        recordAudit(appointment, "CANCELLED", oldStatus, AppointmentStatus.CANCELLED, "Reason: " + reason);

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
        Appointment oldAppointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
                
        // Cancel the old one
        cancelAppointment(appointmentId, "Rescheduled to a new slot");
        
        // Book the new one
        Appointment newAppt = bookAppointment(oldAppointment.getPatient().getUserId(), newSlotId, oldAppointment.getReasonForVisit(), null, null);
        newAppt.setRescheduledFrom(oldAppointment.getId());
        appointmentRepository.save(newAppt);
        recordAudit(newAppt, "RESCHEDULED", null, newAppt.getStatus(), "Rescheduled from appointment #" + oldAppointment.getId());
        return newAppt;
    }

    @Transactional
    public java.util.Map<String, Object> startConsultationProcess(Long appointmentId, Long doctorUserId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Appointment not found"));

        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Doctor profile not found for user ID: " + doctorUserId));

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isStaffOrAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> 
            a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isStaffOrAdmin && (appointment.getDoctor() == null || !appointment.getDoctor().getId().equals(doctor.getId()))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "You are not authorized/assigned to start this appointment.");
        }

        AppointmentStatus currentStatus = appointment.getStatus();

        // Concurrency / Race Condition check: If ALREADY in consultation
        if (currentStatus == AppointmentStatus.IN_CONSULTATION) {
            java.util.Optional<com.healthcare.clinic.doctor.entity.ClinicalEncounter> existingEncounterOpt = encounterRepository.findByAppointmentId(appointmentId);
            if (existingEncounterOpt.isPresent()) {
                com.healthcare.clinic.doctor.entity.ClinicalEncounter existingEncounter = existingEncounterOpt.get();
                if (!existingEncounter.getDoctorId().equals(doctor.getId()) && !isStaffOrAdmin) {
                    throw new com.healthcare.clinic.appointment.exception.AppointmentConflictException(
                            "APPOINTMENT_ALREADY_IN_CONSULTATION",
                            "This appointment is already being handled by another doctor.");
                }
                // Return existing encounter for idempotent re-entry
                java.util.Map<String, Object> result = new java.util.HashMap<>();
                result.put("appointmentId", appointment.getId());
                result.put("encounterId", existingEncounter.getId());
                result.put("status", appointment.getStatus().name());
                result.put("message", "Consultation resumed.");
                return result;
            }
        }

        if (currentStatus == AppointmentStatus.COMPLETED) {
            throw new com.healthcare.clinic.appointment.exception.AppointmentConflictException(
                    "APPOINTMENT_ALREADY_COMPLETED", "This appointment has already been completed.");
        }

        if (currentStatus == AppointmentStatus.CANCELLED || currentStatus == AppointmentStatus.NO_SHOW) {
            throw new com.healthcare.clinic.appointment.exception.AppointmentConflictException(
                    "APPOINTMENT_INVALID_STATE", "Cannot start consultation for a " + currentStatus + " appointment.");
        }

        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.IN_CONSULTATION);
        appointmentRepository.save(appointment);

        // Get or Create Clinical Encounter
        com.healthcare.clinic.doctor.entity.ClinicalEncounter encounter = encounterRepository.findByAppointmentId(appointmentId)
                .orElseGet(() -> {
                    com.healthcare.clinic.doctor.entity.ClinicalEncounter newEnc = new com.healthcare.clinic.doctor.entity.ClinicalEncounter();
                    newEnc.setAppointmentId(appointmentId);
                    newEnc.setPatientId(appointment.getPatient().getUserId());
                    newEnc.setDoctorId(doctor.getId());
                    newEnc.setBranchId(appointment.getBranchId() != null ? appointment.getBranchId() : 1L);
                    newEnc.setStatus(com.healthcare.clinic.doctor.entity.EncounterStatus.IN_PROGRESS);
                    newEnc.setOpenedAt(ZonedDateTime.now());
                    newEnc.setChiefComplaint(appointment.getReasonForVisit());
                    return encounterRepository.save(newEnc);
                });

        recordAudit(appointment, "CONSULTATION_STARTED", oldStatus, AppointmentStatus.IN_CONSULTATION,
                "Consultation started by Dr. User ID " + doctorUserId);

        eventPublisher.publishEvent(AppointmentStatusChangedEvent.builder()
                .appointmentId(appointmentId)
                .oldStatus(oldStatus)
                .newStatus(AppointmentStatus.IN_CONSULTATION)
                .doctorUserId(appointment.getDoctor() != null ? appointment.getDoctor().getUserId() : doctorUserId)
                .branchId(appointment.getBranchId())
                .build());

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("appointmentId", appointment.getId());
        result.put("encounterId", encounter.getId());
        result.put("status", appointment.getStatus().name());
        result.put("message", "Consultation started successfully.");
        return result;
    }

    @Transactional
    public java.util.Map<String, Object> completeConsultationProcess(Long appointmentId, Long doctorUserId, String notes) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Appointment not found"));

        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Doctor profile not found for user ID: " + doctorUserId));

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isStaffOrAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> 
            a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isStaffOrAdmin && (appointment.getDoctor() == null || !appointment.getDoctor().getId().equals(doctor.getId()))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "You are not authorized/assigned to complete this appointment.");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            java.util.Optional<com.healthcare.clinic.doctor.entity.ClinicalEncounter> encOpt = encounterRepository.findByAppointmentId(appointmentId);
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("appointmentId", appointment.getId());
            result.put("encounterId", encOpt.map(com.healthcare.clinic.doctor.entity.ClinicalEncounter::getId).orElse(null));
            result.put("status", appointment.getStatus().name());
            result.put("message", "Appointment is already completed.");
            return result;
        }

        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.COMPLETED);
        if (notes != null && !notes.isBlank()) {
            appointment.setNotes(notes);
        }
        appointmentRepository.save(appointment);

        // Finalize clinical encounter
        java.util.Optional<com.healthcare.clinic.doctor.entity.ClinicalEncounter> encOpt = encounterRepository.findByAppointmentId(appointmentId);
        Long encounterId = null;
        if (encOpt.isPresent()) {
            com.healthcare.clinic.doctor.entity.ClinicalEncounter encounter = encOpt.get();
            encounter.setStatus(com.healthcare.clinic.doctor.entity.EncounterStatus.CLOSED);
            encounter.setClosedAt(ZonedDateTime.now());
            encounter.setFinalizedAt(ZonedDateTime.now());
            encounterRepository.save(encounter);
            encounterId = encounter.getId();
        }

        // Auto-generate invoice
        generateInvoiceForConsultation(appointment);

        recordAudit(appointment, "CONSULTATION_COMPLETED", oldStatus, AppointmentStatus.COMPLETED,
                "Consultation completed by Dr. User ID " + doctorUserId);

        eventPublisher.publishEvent(AppointmentStatusChangedEvent.builder()
                .appointmentId(appointmentId)
                .oldStatus(oldStatus)
                .newStatus(AppointmentStatus.COMPLETED)
                .doctorUserId(appointment.getDoctor() != null ? appointment.getDoctor().getUserId() : doctorUserId)
                .branchId(appointment.getBranchId())
                .build());

        eventPublisher.publishEvent(new AppointmentCompletedEvent(this, appointmentId));

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("appointmentId", appointment.getId());
        result.put("encounterId", encounterId);
        result.put("status", appointment.getStatus().name());
        result.put("message", "Consultation completed successfully.");
        return result;
    }

    @Transactional(readOnly = true)
    public List<com.healthcare.clinic.appointment.entity.AppointmentAuditLog> getAppointmentTimeline(Long appointmentId) {
        assertCanAccessAppointment(appointmentId);
        return auditLogRepository.findByAppointmentIdOrderByCreatedAtDesc(appointmentId);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getAppointmentDetail(Long appointmentId) {
        assertCanAccessAppointment(appointmentId);
        Appointment appointment = getAppointmentById(appointmentId);
        
        java.util.Map<String, Object> detail = new java.util.HashMap<>();
        detail.put("id", appointment.getId());
        detail.put("appointmentNumber", appointment.getAppointmentNumber());
        detail.put("status", appointment.getStatus());
        detail.put("appointmentDate", appointment.getAppointmentDate());
        detail.put("appointmentType", appointment.getAppointmentType());
        detail.put("reasonForVisit", appointment.getReasonForVisit());
        detail.put("notes", appointment.getNotes());
        detail.put("paymentStatus", appointment.getPaymentStatus());
        detail.put("createdAt", appointment.getCreatedAt());

        if (appointment.getPatient() != null) {
            java.util.Map<String, Object> patientMap = new java.util.HashMap<>();
            patientMap.put("id", appointment.getPatient().getId());
            patientMap.put("userId", appointment.getPatient().getUserId());
            userRepository.findById(appointment.getPatient().getUserId()).ifPresent(u -> {
                patientMap.put("firstName", u.getFirstName());
                patientMap.put("lastName", u.getLastName());
                patientMap.put("email", u.getEmail());
                patientMap.put("phone", u.getPhoneNumber());
            });
            detail.put("patient", patientMap);
        }

        if (appointment.getDoctor() != null) {
            java.util.Map<String, Object> doctorMap = new java.util.HashMap<>();
            doctorMap.put("id", appointment.getDoctor().getId());
            doctorMap.put("specialty", appointment.getDoctor().getSpecialty());
            userRepository.findById(appointment.getDoctor().getUserId()).ifPresent(u -> {
                doctorMap.put("doctorName", "Dr. " + u.getFirstName() + " " + u.getLastName());
            });
            detail.put("doctor", doctorMap);
        }

        if (appointment.getSlot() != null) {
            detail.put("startTime", appointment.getSlot().getStartTime());
            detail.put("endTime", appointment.getSlot().getEndTime());
        }

        // Include Queue Token
        queueTokenRepository.findByAppointmentId(appointmentId).stream().findFirst().ifPresent(t -> {
            detail.put("tokenNumber", t.getTokenNumber());
            detail.put("tokenStatus", t.getStatus());
        });

        // Include Clinical Encounter ID if available
        encounterRepository.findByAppointmentId(appointmentId).ifPresent(enc -> {
            detail.put("encounterId", enc.getId());
            detail.put("encounterStatus", enc.getStatus());
        });

        // Include Timeline / Audit Events
        detail.put("timeline", auditLogRepository.findByAppointmentIdOrderByCreatedAtDesc(appointmentId));

        return detail;
    }
}
