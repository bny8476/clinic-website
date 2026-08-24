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

    @GetMapping("/slots")
    public ResponseEntity<ApiResponse<List<AppointmentSlot>>> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime end) {
        
        List<AppointmentSlot> slots = appointmentService.getAvailableSlots(doctorId, start, end);
        return ResponseEntity.ok(ApiResponse.success(slots));
    }

    private final com.healthcare.clinic.appointment.service.AppointmentHoldService holdService;

    @PostMapping("/book")
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Appointment>> bookAppointment(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @jakarta.validation.Valid @RequestBody BookingRequest request) {
        
        Long currentUserId = com.healthcare.clinic.security.SecurityUtils.getCurrentUserId();
        Long targetPatientUserId = request.getPatientUserId() != null ? request.getPatientUserId() : currentUserId;

        if (holdService.isIdempotencyKeyProcessed(idempotencyKey)) {
            Long existingId = holdService.getAppointmentIdForIdempotencyKey(idempotencyKey);
            if (existingId != null) {
                return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentById(existingId), "Appointment retrieved from idempotency key"));
            }
        }

        Appointment appointment = appointmentService.bookAppointment(
                targetPatientUserId, 
                request.getParsedSlotId(), 
                request.getReasonForVisit(),
                request.getHoldId(),
                idempotencyKey);
                
        if (idempotencyKey != null) {
            holdService.saveIdempotencyKey(idempotencyKey, appointment.getId());
        }

        return ResponseEntity.ok(ApiResponse.success(appointment, "Appointment booked successfully"));
    }

    @GetMapping("/patient/{userId}")
    @PreAuthorize("hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<com.healthcare.clinic.appointment.dto.AppointmentResponseDto>>> getAppointmentsForPatient(@PathVariable Long userId) {
        com.healthcare.clinic.security.SecurityUtils.assertOwnerOrAdmin(userId);
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getPatientAppointments(userId)));
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
        Long currentUserId = com.healthcare.clinic.security.SecurityUtils.getCurrentUserId();
        // Since we don't have the user's role here trivially without injecting something else, 
        // we'll just return all today's appointments for the entire branch/clinic, assuming a single branch for now,
        // or we can fetch by doctor if it's a doctor. For simplicity and as required, returning today's queue.
        // I will need to add `getAllTodayAppointments()` to `AppointmentService`. Let's add it in the next step.
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAllTodayAppointments()));
    }
}

@Data
class BookingRequest {
    
    private Object slotId;
    
    @jakarta.validation.constraints.NotBlank
    @jakarta.validation.constraints.Size(max = 500)
    private String reasonForVisit;

    private String holdId;
    
    private Long patientUserId;

    public Long getParsedSlotId() {
        if (slotId == null) return null;
        if (slotId instanceof Number) return ((Number) slotId).longValue();
        try {
            return Long.parseLong(slotId.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
