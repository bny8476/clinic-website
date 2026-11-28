package com.healthcare.clinic.support.integration;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.support.entity.*;
import com.healthcare.clinic.support.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@org.springframework.test.context.ActiveProfiles("test")
public class SupportIntegrationTest {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private SupportService supportService;

    @Autowired
    private AssignmentService assignmentService;

    @Autowired
    private KnowledgeBaseService kbService;

    @Autowired
    private CsatSurveyService csatService;

    @Autowired
    private EscalationService escalationService;

    @Autowired
    private UserRepository userRepository;

    private UserPrincipal toPrincipal(User u) {
        return u != null ? new UserPrincipal(u.getId(), u.getEmail(), u.getAuthorities(), u.getBranchId()) : null;
    }

    @Test
    public void testTicketCreationAndSla() {
        User patient = userRepository.findByEmail("patient1@example.com")
                .or(() -> userRepository.findAll().stream().findFirst())
                .orElse(null);
        
        assertNotNull(patient, "A sample user must exist in the database");

        SpTicket req = new SpTicket();
        req.setSubject("Need help with billing");
        req.setDescription("I cannot see my last invoice.");
        req.setCategory("BILLING");
        req.setPriority("HIGH");
        
        SpTicket ticket = ticketService.createTicket(req, toPrincipal(patient));
        
        assertNotNull(ticket.getId());
        assertNotNull(ticket.getTicketNumber());
        assertEquals("HIGH", ticket.getPriority());
        assertNotNull(ticket.getFirstResponseDueAt());
        assertEquals("ON_TRACK", ticket.getSlaStatus());
    }

    @Test
    public void testSupportServiceEndToEndFlow() {
        User patient = userRepository.findByEmail("patient1@example.com")
                .or(() -> userRepository.findAll().stream().findFirst())
                .orElse(null);
        assertNotNull(patient);

        User agent = userRepository.findByEmail("admin@clinic.com")
                .or(() -> userRepository.findAll().stream().filter(u -> !u.getId().equals(patient.getId())).findFirst())
                .orElse(patient);

        // 1. Create a support ticket
        SupportTicket ticket = SupportTicket.builder()
                .subject("Prescription download issue")
                .category("TECHNICAL")
                .priority("URGENT")
                .build();

        SupportTicket created = supportService.createTicket(ticket, toPrincipal(patient), "I cannot download my prescription PDF");
        assertNotNull(created.getId());
        assertEquals("OPEN", created.getStatus());
        assertTrue(created.getTicketNumber().startsWith("TICK-"));

        // 2. Verify messages
        List<SupportMessage> msgs = supportService.getTicketMessages(created.getId());
        assertFalse(msgs.isEmpty());
        assertEquals("I cannot download my prescription PDF", msgs.get(0).getMessage());
        assertFalse(msgs.get(0).getIsAgentResponse());

        // 3. Agent replies -> automatically marks as IN_PROGRESS and assigns agent
        SupportMessage agentMsg = supportService.addMessage(created.getId(), toPrincipal(agent), "We are looking into the PDF generator", true);
        assertNotNull(agentMsg.getId());
        assertTrue(agentMsg.getIsAgentResponse());

        SupportTicket inProgressTicket = supportService.getAllTickets().stream()
                .filter(t -> t.getId().equals(created.getId()))
                .findFirst()
                .orElseThrow();
        assertEquals("IN_PROGRESS", inProgressTicket.getStatus());
        assertNotNull(inProgressTicket.getAssignedAgent());

        // 4. Update status to RESOLVED
        SupportTicket resolved = supportService.updateTicketStatus(created.getId(), "RESOLVED");
        assertEquals("RESOLVED", resolved.getStatus());
    }

    @Test
    public void testEnterpriseSupportLifecycleAndSurveys() {
        User patient = userRepository.findByEmail("patient1@example.com")
                .or(() -> userRepository.findAll().stream().findFirst())
                .orElse(null);
        assertNotNull(patient);

        // 1. Create Enterprise Ticket
        SpTicket ticketReq = new SpTicket();
        ticketReq.setSubject("Lab Report Inaccuracy Dispute");
        ticketReq.setDescription("My blood test shows wrong reference ranges.");
        ticketReq.setCategory("LABORATORY");
        ticketReq.setPriority("CRITICAL");

        SpTicket ticket = ticketService.createTicket(ticketReq, toPrincipal(patient));
        assertNotNull(ticket.getId());

        // 2. Assignment
        UserPrincipal agentPrincipal = toPrincipal(patient);
        SpTicket assigned = assignmentService.assignTicket(ticket.getId(), agentPrincipal, agentPrincipal, "Assigned to lead clinical support specialist");
        assertNotNull(assigned.getAssignedAgent());

        // 3. Escalation
        SpEscalation escalation = escalationService.escalateTicket(ticket.getId(), patient, "LAB_DIRECTORS", "Immediate re-evaluation requested");
        assertNotNull(escalation.getId());
        assertEquals("ESCALATED", escalation.getTicket().getStatus());

        // 4. Resolution
        SpTicket resolved = ticketService.updateTicketStatus(ticket.getId(), "RESOLVED", agentPrincipal);
        assertEquals("RESOLVED", resolved.getStatus());
        assertNotNull(resolved.getResolvedAt());

        // 5. CSAT Survey
        SpCsatSurvey survey = csatService.sendSurvey(ticket.getId());
        assertNotNull(survey.getId());
        assertFalse(survey.getIsResponded());

        SpCsatSurvey completedSurvey = csatService.submitResponse(survey.getId(), 5, "Problem resolved within 30 minutes! Excellent care.");
        assertTrue(completedSurvey.getIsResponded());
        assertEquals(5, completedSurvey.getRating());
        assertNotNull(completedSurvey.getRespondedAt());

        // 6. Knowledge Base Article search
        SpKnowledgeArticle article = kbService.createArticle("How to access lab reports", "Step by step guide to viewing lab reports", "Go to Patient Portal -> Lab Reports", "PATIENTS_ONLY", patient);
        article.setStatus("PUBLISHED");
        assertNotNull(article.getId());

        List<SpKnowledgeArticle> results = kbService.searchArticles("lab reports", "PATIENTS_ONLY");
        assertFalse(results.isEmpty());
        assertTrue(results.stream().anyMatch(a -> a.getTitle().contains("lab reports")));
    }
}
