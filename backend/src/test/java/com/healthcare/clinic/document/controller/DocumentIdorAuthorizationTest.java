package com.healthcare.clinic.document.controller;

import com.healthcare.clinic.document.entity.Document;
import com.healthcare.clinic.document.service.DocumentService;
import com.healthcare.clinic.document.service.DocumentStorageService;
import com.healthcare.clinic.document.service.ShareService;
import com.healthcare.clinic.document.service.SignatureService;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DocumentIdorAuthorizationTest {

    @Mock
    private DocumentService documentService;

    @Mock
    private SignatureService signatureService;

    @Mock
    private ShareService shareService;

    @Mock
    private DocumentStorageService storageService;

    @InjectMocks
    private DocumentController documentController;

    private UserPrincipal patientA;
    private UserPrincipal patientB;
    private Document documentA;
    private Document documentB;

    @BeforeEach
    void setUp() {
        patientA = new UserPrincipal(
                101L,
                "patientA",
                List.of(new SimpleGrantedAuthority("ROLE_PATIENT")),
                1L
        );

        patientB = new UserPrincipal(
                102L,
                "patientB",
                List.of(new SimpleGrantedAuthority("ROLE_PATIENT")),
                1L
        );

        documentA = Document.builder()
                .id(1L)
                .ownerType("PATIENT")
                .ownerId(101L)
                .uploadedByUserId(101L)
                .title("Document A")
                .storageKey("keys/docA.pdf")
                .mimeType("application/pdf")
                .fileSizeBytes(1024L)
                .originalFilename("docA.pdf")
                .status("ACTIVE")
                .branchId(1L)
                .build();

        documentB = Document.builder()
                .id(2L)
                .ownerType("PATIENT")
                .ownerId(102L)
                .uploadedByUserId(102L)
                .title("Document B")
                .storageKey("keys/docB.pdf")
                .mimeType("application/pdf")
                .fileSizeBytes(2048L)
                .originalFilename("docB.pdf")
                .status("ACTIVE")
                .branchId(1L)
                .build();
    }

    @Test
    void testPatientA_AccessOwnDocument_Success() {
        when(documentService.getDocumentForUser(1L, patientA)).thenReturn(documentA);

        var response = documentController.getDocument(1L, patientA);

        assertNotNull(response);
        assertEquals(documentA, response.getBody());
        verify(documentService).getDocumentForUser(1L, patientA);
    }

    @Test
    void testPatientA_AccessDocumentB_Forbidden() {
        when(documentService.getDocumentForUser(2L, patientA))
                .thenThrow(new AccessDeniedException("Access denied: You do not have permission to access this document."));

        assertThrows(AccessDeniedException.class, () -> documentController.getDocument(2L, patientA));
        verify(documentService).getDocumentForUser(2L, patientA);
    }

    @Test
    void testPatientA_DownloadDocumentB_Forbidden() {
        when(documentService.getDocumentForUser(2L, patientA))
                .thenThrow(new AccessDeniedException("Access denied: You do not have permission to access this document."));

        assertThrows(AccessDeniedException.class, () -> documentController.downloadDocument(2L, patientA));
        verify(documentService).getDocumentForUser(2L, patientA);
        verifyNoInteractions(storageService);
    }

    @Test
    void testPatientA_GetVersionHistoryDocumentB_Forbidden() {
        when(documentService.getDocumentForUser(2L, patientA))
                .thenThrow(new AccessDeniedException("Access denied: You do not have permission to access this document."));

        assertThrows(AccessDeniedException.class, () -> documentController.getVersionHistory(2L, patientA));
        verify(documentService).getDocumentForUser(2L, patientA);
    }

    @Test
    void testPatientA_DeleteDocumentB_Forbidden() {
        when(documentService.getDocumentForUser(2L, patientA))
                .thenThrow(new AccessDeniedException("Access denied: You do not have permission to access this document."));

        assertThrows(AccessDeniedException.class, () -> documentController.softDeleteDocument(2L, patientA));
        verify(documentService).getDocumentForUser(2L, patientA);
    }

    @Test
    void testPatientA_DeleteOwnDocument_ForbiddenIfNotOwner() {
        when(documentService.getDocumentForUser(1L, patientA)).thenReturn(documentA);
        doThrow(new AccessDeniedException("Access denied: Only document owner or admin can perform this modification."))
                .when(documentService).checkDocumentOwnership(documentA, patientA);

        assertThrows(AccessDeniedException.class, () -> documentController.softDeleteDocument(1L, patientA));
    }

    @Test
    void testPatientB_AccessOwnDocument_Success() {
        when(documentService.getDocumentForUser(2L, patientB)).thenReturn(documentB);

        var response = documentController.getDocument(2L, patientB);

        assertNotNull(response);
        assertEquals(documentB, response.getBody());
        verify(documentService).getDocumentForUser(2L, patientB);
    }
}
