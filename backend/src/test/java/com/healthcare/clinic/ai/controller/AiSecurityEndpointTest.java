package com.healthcare.clinic.ai.controller;

import com.healthcare.clinic.ai.dto.AiChatRequest;
import com.healthcare.clinic.ai.dto.AiChatResponse;
import com.healthcare.clinic.ai.service.AiChatService;
import com.healthcare.clinic.ai.service.AiConversationService;
import com.healthcare.clinic.ai.service.AiDoctorService;
import com.healthcare.clinic.ai.service.AiPatientService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiSecurityEndpointTest {

    @Mock
    private AiChatService aiChatService;

    @Mock
    private AiConversationService conversationService;

    @Mock
    private AiDoctorService aiDoctorService;

    @Mock
    private AiPatientService aiPatientService;

    @InjectMocks
    private AiChatController aiChatController;

    @InjectMocks
    private AiDoctorController aiDoctorController;

    @InjectMocks
    private AiPatientController aiPatientController;

    @Test
    @DisplayName("Unauthenticated user calling getConversations returns 401 Unauthorized")
    void testGetConversationsUnauthenticatedReturns401() {
        // Unauthenticated context (userId is null)
        ResponseEntity<?> response = aiChatController.getConversations();
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verifyNoInteractions(conversationService);
    }

    @Test
    @DisplayName("Public chat endpoint supports guest chat requests")
    void testPublicChatProcessesGuestRequest() {
        AiChatRequest request = new AiChatRequest();
        request.setMessage("Hello AI");

        AiChatResponse chatResponse = new AiChatResponse();
        chatResponse.setSuccess(true);
        chatResponse.setMessage("Hello User");

        when(aiChatService.processChat(any(AiChatRequest.class), eq(null), eq("ROLE_ANONYMOUS"), any()))
                .thenReturn(chatResponse);

        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        ResponseEntity<AiChatResponse> response = aiChatController.chat(request, servletRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    @DisplayName("Doctor AI summarize-encounter invokes AiDoctorService for authorized requests")
    void testDoctorAiSummarizeEncounter() {
        when(aiDoctorService.generateSummary(10L, 20L, 1L)).thenReturn("Clinical Summary");

        ResponseEntity<String> response = aiDoctorController.summarizeEncounter(10L, 20L, 1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Clinical Summary", response.getBody());
    }
}
