package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.entity.TeleconsultationRequest;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.patient.repository.TeleconsultationRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeleconsultationServiceTest {

    @Mock
    private TeleconsultationRequestRepository teleconsultationRequestRepository;

    @Mock
    private PatientProfileRepository patientProfileRepository;

    @InjectMocks
    private TeleconsultationService teleconsultationService;

    private User user;
    private PatientProfile profile;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(200L);

        profile = new PatientProfile();
        profile.setId(50L);
        profile.setUserId(200L);
    }

    @Test
    @DisplayName("Requesting teleconsultation uses real generated database primary key ID for join link instead of hardcoded 1L")
    void testRequestTeleconsultationRealIdJoinLink() {
        when(patientProfileRepository.findByUserId(200L)).thenReturn(Optional.of(profile));

        TeleconsultationRequest request = new TeleconsultationRequest();
        request.setReason("Chest tightness");
        request.setPreferredDates("Today");
        request.setPreferredTimes("2 PM");

        when(teleconsultationRequestRepository.save(any(TeleconsultationRequest.class))).thenAnswer(invocation -> {
            TeleconsultationRequest req = invocation.getArgument(0);
            if (req.getId() == null) {
                req.setId(105L); // Simulate DB primary key generation
            }
            return req;
        });

        TeleconsultationRequest saved = teleconsultationService.requestTeleconsultation(user, request);

        assertNotNull(saved);
        assertEquals(105L, saved.getId());
        assertEquals("/teleconsultation/room/session-105", saved.getJoinLink(), "Join link must incorporate actual DB ID, not hardcoded 1L");
        assertNotEquals("/teleconsultation/room/1", saved.getJoinLink());
    }

    @Test
    @DisplayName("Linking clinical encounter updates join link to real encounter ID")
    void testLinkEncounterToTeleconsultation() {
        TeleconsultationRequest existing = new TeleconsultationRequest();
        existing.setId(105L);
        existing.setJoinLink("/teleconsultation/room/session-105");

        when(teleconsultationRequestRepository.findById(105L)).thenReturn(Optional.of(existing));
        when(teleconsultationRequestRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        TeleconsultationRequest updated = teleconsultationService.linkEncounterToTeleconsultation(105L, 501L);

        assertNotNull(updated);
        assertEquals("/teleconsultation/room/501", updated.getJoinLink());
    }
}
