package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.identity.entity.Role;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.RoleRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.patient.entity.AiChatMessage;
import com.healthcare.clinic.patient.entity.AiChatSession;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.entity.PatientDocument;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.patient.dto.TimelineEventDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
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
    private RoleRepository roleRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private BranchRepository branchRepository;

    private User testPatient;
    private Branch testBranch;

    @BeforeEach
    void setUp() {
        Role patientRole = roleRepository.findByName("ROLE_PATIENT")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName("ROLE_PATIENT");
                    return roleRepository.save(r);
                });

        testPatient = new User();
        testPatient.setEmail("testpatient_batch3@example.com");
        testPatient.setPasswordHash("password");
        testPatient.setFirstName("Test");
        testPatient.setLastName("Patient");
        testPatient.setRoles(Set.of(patientRole));
        testPatient = userRepository.save(testPatient);

        testBranch = new Branch();
        testBranch.setName("Main Branch");
        testBranch.setAddress("123 Branch St");
        testBranch.setCity("City");
        testBranch.setState("State");
        testBranch.setCountry("Country");
        testBranch.setPostalCode("12345");
        testBranch.setTimezone("UTC");
        testBranch = branchRepository.save(testBranch);

        PatientProfile profile = new PatientProfile();
        profile.setUserId(testPatient.getId());
        profile.setBranchId(testBranch.getId());
        profile.setDateOfBirth(LocalDate.of(1990, 1, 1));
        profile.setGender("Male");
        profile.setEmergencyContactName("Jane Doe");
        profile.setEmergencyContactPhone("0987654321");
        patientProfileRepository.save(profile);
    }

    @Test
    void testAiAssistantWorkflow() {
        // 1. Get or create session
        AiChatSession session = aiAssistantService.getOrCreateActiveSession(testPatient);
        assertThat(session).isNotNull();

        // 2. Send message
        AiChatMessage aiResponse = aiAssistantService.sendMessage(testPatient, session.getId(), "I have a headache");
        assertThat(aiResponse).isNotNull();
        assertThat(aiResponse.getSenderType()).isEqualTo("AI");
        assertThat(aiResponse.getContent()).containsIgnoringCase("headache");

        // 3. Verify chat history
        List<AiChatMessage> history = aiAssistantService.getSessionMessages(testPatient, session.getId());
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
        PatientDocument saved = patientDocumentService.saveDocumentMetadata(testPatient, doc, null);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getFileUrl()).isEqualTo("https://example.com/mock-document-url.pdf");

        // 2. Retrieve documents
        List<PatientDocument> documents = patientDocumentService.getPatientDocuments(testPatient);
        assertThat(documents).hasSize(1);
        assertThat(documents.get(0).getTitle()).isEqualTo("Blood Test Result");
    }

    @Test
    void testHealthTimelineAggregation() {
        // Create a document which should appear in the timeline
        PatientDocument doc = new PatientDocument();
        doc.setTitle("Prescription Scan");
        doc.setDocumentType("Prescription");
        patientDocumentService.saveDocumentMetadata(testPatient, doc, null);

        // Fetch timeline
        List<TimelineEventDTO> timeline = healthTimelineService.getTimelineEvents(testPatient);
        
        assertThat(timeline).isNotEmpty();
        assertThat(timeline.get(0).getType()).isEqualTo("PRESCRIPTION");
        assertThat(timeline.get(0).getTitle()).isEqualTo("Prescription Scan");
    }
}
