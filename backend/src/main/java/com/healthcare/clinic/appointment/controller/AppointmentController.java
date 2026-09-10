package com.healthcare.clinic.appointment.controller;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.entity.AppointmentSlot;
import com.healthcare.clinic.appointment.service.AppointmentService;
import com.healthcare.clinic.appointment.service.AppointmentHoldService;
import com.healthcare.clinic.appointment.dto.AppointmentResponseDto;
import com.healthcare.clinic.appointment.entity.AppointmentStatus;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.healthcare.clinic.common.dto.ApiResponse;

import java.time.ZonedDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final com.healthcare.clinic.identity.repository.UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<ApiResponse<List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto>>> getAllAppointments(
            @RequestParam(required = false) Long patientUserId,
            @RequestParam(required = false) Long doctorId) {
        if (patientUserId != null) {
            return ResponseEntity.ok(ApiResponse.success(appointmentService.getPatientAppointments(patientUserId)));
        } else if (doctorId != null) {
            return ResponseEntity.ok(ApiResponse.success(appointmentService.getDoctorAppointments(doctorId)));
        }
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null) {
            try {
                return ResponseEntity.ok(ApiResponse.success(appointmentService.getDoctorAppointments(currentUserId)));
            } catch (Exception e) {
                return ResponseEntity.ok(ApiResponse.success(appointmentService.getPatientAppointments(currentUserId)));
            }
        }
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAllTodayAppointments()));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DOCTOR')")
    public ResponseEntity<ApiResponse<Appointment>> createAppointmentAlias(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody com.healthcare.clinic.appointment.dto.BookingRequest request) {
        return bookAppointment(idempotencyKey, request);
    }

    @GetMapping("/slots")
    public ResponseEntity<ApiResponse<List<AppointmentSlot>>> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime end) {
        
        List<AppointmentSlot> slots = appointmentService.getAvailableSlots(doctorId, start, end);
        return ResponseEntity.ok(ApiResponse.success(slots));
    }

    @GetMapping("/available-slots")
    public ResponseEntity<List<java.util.Map<String, Object>>> getAvailableSlotsByDate(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        List<java.util.Map<String, Object>> slots = appointmentService.getAvailableSlotsForDoctorAndDate(doctorId, date);
        return ResponseEntity.ok(slots);
    }

    private final com.healthcare.clinic.appointment.service.AppointmentHoldService holdService;

    @PostMapping("/guest")
    public ResponseEntity<ApiResponse<Appointment>> bookGuestAppointment(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @jakarta.validation.Valid @RequestBody com.healthcare.clinic.appointment.dto.BookingRequest request) {

        if (request.getPatientEmail() != null && !request.getPatientEmail().isBlank()) {
            com.healthcare.clinic.identity.entity.User existingUser = userRepository.findByEmail(request.getPatientEmail().trim()).orElse(null);
            if (existingUser != null && existingUser.getPasswordHash() != null && !existingUser.getPasswordHash().isBlank()) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT)
                        .body(ApiResponse.<Appointment>error("An account already exists with these details. Please log in to continue booking."));
            }
        }
        if (request.getPatientPhone() != null && !request.getPatientPhone().isBlank()) {
            com.healthcare.clinic.identity.entity.User existingUser = userRepository.findByPhoneNumber(request.getPatientPhone().trim()).orElse(null);
            if (existingUser != null && existingUser.getPasswordHash() != null && !existingUser.getPasswordHash().isBlank()) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT)
                        .body(ApiResponse.<Appointment>error("An account already exists with these details. Please log in to continue booking."));
            }
        }

        if (holdService.isIdempotencyKeyProcessed(idempotencyKey)) {
            Long existingId = holdService.getAppointmentIdForIdempotencyKey(idempotencyKey);
            if (existingId != null) {
                return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentById(existingId), "Appointment retrieved from idempotency key"));
            }
        }

        Appointment appointment = appointmentService.bookAppointmentFromRequest(request, idempotencyKey);

        if (idempotencyKey != null) {
            holdService.saveIdempotencyKey(idempotencyKey, appointment.getId());
        }

        return ResponseEntity.ok(ApiResponse.success(appointment, "Guest appointment booked successfully"));
    }

    @PostMapping("/book")
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DOCTOR')")
    public ResponseEntity<ApiResponse<Appointment>> bookAppointment(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @jakarta.validation.Valid @RequestBody com.healthcare.clinic.appointment.dto.BookingRequest request) {

        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null && SecurityUtils.isPatient()) {
            request.setPatientUserId(currentUserId);
        }

        if (holdService.isIdempotencyKeyProcessed(idempotencyKey)) {
            Long existingId = holdService.getAppointmentIdForIdempotencyKey(idempotencyKey);
            if (existingId != null) {
                return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentById(existingId), "Appointment retrieved from idempotency key"));
            }
        }

        Appointment appointment = appointmentService.bookAppointmentFromRequest(request, idempotencyKey);
                
        if (idempotencyKey != null) {
            holdService.saveIdempotencyKey(idempotencyKey, appointment.getId());
        }

        return ResponseEntity.ok(ApiResponse.success(appointment, "Appointment booked successfully"));
    }

    @GetMapping("/patient/{userId}")
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_NURSE')")
    public ResponseEntity<ApiResponse<List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto>>> getAppointmentsForPatient(@PathVariable Long userId) {
        com.healthcare.clinic.security.SecurityUtils.assertOwnerOrAdmin(userId);
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getPatientAppointments(userId)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto>>> getMyAppointments() {
        Long currentUserId = com.healthcare.clinic.security.SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getPatientAppointments(currentUserId)));
    }

    @GetMapping("/doctor/{userId}")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto>>> getAppointmentsForDoctor(@PathVariable Long userId) {
        com.healthcare.clinic.security.SecurityUtils.assertOwnerOrAdmin(userId);
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getDoctorAppointments(userId)));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto>>> getTodayAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime end) {
        Long currentUserId = com.healthcare.clinic.security.SecurityUtils.getCurrentUserId();
        
        if (start != null && end != null) {
            return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentsInRange(currentUserId, start, end)));
        } else {
            return ResponseEntity.ok(ApiResponse.success(appointmentService.getTodayAppointments(currentUserId)));
        }
    }

    @GetMapping("/doctor/me")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto>>> getMyDoctorAppointments() {
        Long currentUserId = com.healthcare.clinic.security.SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getDoctorAppointments(currentUserId)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_NURSE')")
    public ResponseEntity<ApiResponse<Void>> updateAppointmentStatus(@PathVariable Long id, @RequestParam AppointmentStatus status) {
        appointmentService.updateAppointmentStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(null, "Appointment status updated"));
    }

    @PatchMapping("/{id}/check-in")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE')")
    public ResponseEntity<ApiResponse<Void>> checkInAppointment(@PathVariable Long id) {
        appointmentService.updateAppointmentStatus(id, AppointmentStatus.CHECKED_IN);
        return ResponseEntity.ok(ApiResponse.success(null, "Patient checked in successfully"));
    }

    @RequestMapping(value = "/{id}/start", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> startConsultation(@PathVariable Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        java.util.Map<String, Object> result = appointmentService.startConsultationProcess(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(result, "Consultation started"));
    }

    @RequestMapping(value = "/{id}/complete", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> completeConsultation(@PathVariable Long id, @RequestParam(required = false) String notes) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        java.util.Map<String, Object> result = appointmentService.completeConsultationProcess(id, currentUserId, notes);
        return ResponseEntity.ok(ApiResponse.success(result, "Consultation completed"));
    }

    @GetMapping("/{id}/timeline")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<com.healthcare.clinic.appointment.entity.AppointmentAuditLog>>> getAppointmentTimeline(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentTimeline(id)));
    }

    @GetMapping("/{id}/detail")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getAppointmentDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentDetail(id)));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<ApiResponse<Void>> cancelAppointment(@PathVariable Long id, @RequestParam String reason) {
        appointmentService.assertCanAccessAppointment(id);
        appointmentService.cancelAppointment(id, reason);
        return ResponseEntity.ok(ApiResponse.success(null, "Appointment cancelled successfully"));
    }
    
    @PatchMapping("/{id}/reschedule")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<ApiResponse<Appointment>> rescheduleAppointment(@PathVariable Long id, @RequestParam Long newSlotId) {
        appointmentService.assertCanAccessAppointment(id);
        Appointment newAppt = appointmentService.rescheduleAppointment(id, newSlotId);
        return ResponseEntity.ok(ApiResponse.success(newAppt, "Appointment rescheduled successfully"));
    }

    @GetMapping("/queue")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_NURSE')")
    public ResponseEntity<ApiResponse<List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto>>> getAppointmentQueue() {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAllTodayAppointments()));
    }
}
