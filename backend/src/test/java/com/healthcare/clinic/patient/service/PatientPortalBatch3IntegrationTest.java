package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.dto.TimelineEventDTO;
import com.healthcare.clinic.patient.entity.AiChatMessage;
import com.healthcare.clinic.patient.entity.AiChatSession;
import com.healthcare.clinic.patient.entity.PatientDocument;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
public class PatientPortalBatch3IntegrationTest {

    @Autowired
    private AiAssistantService aiAssistantService;

    @Autowired
    private PatientDocumentService patientDocumentService;

    @Autowired
    private HealthTimelineService healthTimelineService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    private User testPatient;
    private PatientProfile profile;

    private UserPrincipal toPrincipal(User u) {
        return u != null ? new UserPrincipal(u.getId(), u.getEmail(), u.getAuthorities(), u.getBranchId()) : null;
    }

    @BeforeEach
    void setUp() {
        testPatient = new User();
        testPatient.setEmail("batch3patient@example.com");
        testPatient.setPasswordHash("hash");
        testPatient.setFirstName("Alice");
        testPatient.setLastName("Smith");
        testPatient.setBranchId(1L);
        userRepository.save(testPatient);

        profile = new PatientProfile();
        profile.setUserId(testPatient.getId());
        profile.setBranchId(1L);
        profile.setGender("Female");
        profile.setBloodGroup("A+");
        profile.setEmergencyContactName("Bob Smith");
        profile.setEmergencyContactPhone("0987654321");
        patientProfileRepository.save(profile);
    }

    @Test
    void testAiAssistantWorkflow() {
        // 1. Get or create session
        AiChatSession session = aiAssistantService.getOrCreateActiveSession(toPrincipal(testPatient));
        assertThat(session).isNotNull();

        // 2. Send message
        AiChatMessage aiResponse = aiAssistantService.sendMessage(toPrincipal(testPatient), session.getId(), "I have a headache");
        assertThat(aiResponse).isNotNull();
        assertThat(aiResponse.getSenderType()).isEqualTo("AI");
        assertThat(aiResponse.getContent()).containsIgnoringCase("headache");

        // 3. Verify chat history
        List<AiChatMessage> history = aiAssistantService.getSessionMessages(toPrincipal(testPatient), session.getId());
        assertThat(history).hasSize(2);
        assertThat(history.get(0).getSenderType()).isEqualTo("USER");
        assertThat(history.get(1).getSenderType()).isEqualTo("AI");
    }

    @Test
    void testPatientDocumentWorkflow() {
        // 1. Save document metadata
        PatientDocument doc = new PatientDocument();
        doc.setTitle("Blood Test Result");
        doc.setDocumentType("Lab Report");
        PatientDocument saved = patientDocumentService.saveDocumentMetadata(toPrincipal(testPatient), doc, null);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getFileUrl()).isEqualTo("");

        // 2. Retrieve documents
        List<PatientDocument> documents = patientDocumentService.getPatientDocuments(toPrincipal(testPatient));
        assertThat(documents).hasSize(1);
        assertThat(documents.get(0).getTitle()).isEqualTo("Blood Test Result");
    }

    @Test
    void testHealthTimelineAggregation() {
        // Create a document which should appear in the timeline
        PatientDocument doc = new PatientDocument();
        doc.setTitle("Prescription Scan");
        doc.setDocumentType("Prescription");
        patientDocumentService.saveDocumentMetadata(toPrincipal(testPatient), doc, null);

        // Fetch timeline
        List<TimelineEventDTO> timeline = healthTimelineService.getTimelineEvents(testPatient);
        assertThat(timeline).isNotNull();
        assertThat(timeline).isNotEmpty();
    }
}
