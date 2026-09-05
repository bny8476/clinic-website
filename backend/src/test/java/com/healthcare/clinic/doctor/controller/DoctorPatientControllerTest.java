package com.healthcare.clinic.doctor.controller;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.entity.AppointmentSlot;
import com.healthcare.clinic.appointment.entity.AppointmentStatus;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.doctor.dto.MyPatientResponse;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class DoctorPatientControllerTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientProfileRepository patientProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.healthcare.clinic.doctor.repository.PrescriptionRepository prescriptionRepository;

    @InjectMocks
    private DoctorPatientController doctorPatientController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        com.healthcare.clinic.security.UserPrincipal principal = mock(com.healthcare.clinic.security.UserPrincipal.class);
        when(principal.getUserId()).thenReturn(1L);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    public void testDoctorWithZeroAppointments() {
        when(appointmentRepository.findByDoctor_UserId(1L)).thenReturn(Collections.emptyList());
        
        ResponseEntity<List<MyPatientResponse>> response = doctorPatientController.getMyPatients();
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    public void testAppointmentWithNullSlot() {
        PatientProfile patient = new PatientProfile();
        patient.setId(100L);
        patient.setUserId(200L);

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setStatus(AppointmentStatus.BOOKED);
        appointment.setCreatedAt(ZonedDateTime.now());
        // Slot is null

        when(patientProfileRepository.findAll()).thenReturn(Collections.singletonList(patient));
        when(appointmentRepository.findByDoctor_UserId(1L)).thenReturn(Collections.singletonList(appointment));
        when(userRepository.findById(200L)).thenReturn(Optional.empty());

        ResponseEntity<List<MyPatientResponse>> response = doctorPatientController.getMyPatients();
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertNull(response.getBody().get(0).getUpcomingAppointmentDate());
    }

    @Test
    public void testPatientBelongingToDifferentDoctorReturnsEmptyHistory() {
        PatientProfile patient = new PatientProfile();
        patient.setId(100L);
        patient.setUserId(200L);

        when(patientProfileRepository.findByUserId(200L)).thenReturn(Optional.of(patient));
        when(appointmentRepository.findByDoctor_UserId(1L)).thenReturn(Collections.emptyList());

        ResponseEntity<com.healthcare.clinic.doctor.dto.PatientDetailResponse> response = doctorPatientController.getPatientDetail(200L);
        
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getAppointmentHistory().isEmpty(), "History should be empty for unauthorized access or zero overlap");
    }

    @Test
    public void testAppointmentWithNullDoctorDoesNotThrowException() {
        // Even if we mock findByDoctor_UserId returning a list that somehow contains an appointment with null doctor 
        // (which shouldn't happen via DB query, but could happen via Mock), it shouldn't crash.
        PatientProfile patient = new PatientProfile();
        patient.setId(100L);
        
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(null); 
        
        when(appointmentRepository.findByDoctor_UserId(1L)).thenReturn(Collections.singletonList(appointment));

        assertDoesNotThrow(() -> {
            doctorPatientController.getMyPatients();
        });
    }
}
