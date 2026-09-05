package com.healthcare.clinic.document.service;

import com.healthcare.clinic.document.entity.Document;
import com.healthcare.clinic.document.entity.DocumentShare;
import com.healthcare.clinic.document.repository.DocumentRepository;
import com.healthcare.clinic.document.repository.DocumentShareRepository;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DocumentServiceIdorTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentShareRepository shareRepository;

    @Mock
    private DocumentStorageService storageService;

    @InjectMocks
    private DocumentService documentService;

    private UserPrincipal patientA;
    private UserPrincipal patientB;
    private UserPrincipal doctor;
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

        doctor = new UserPrincipal(
                201L,
                "doctor1",
                List.of(new SimpleGrantedAuthority("ROLE_DOCTOR")),
                1L
        );

        documentA = Document.builder()
                .id(1L)
                .ownerType("PATIENT")
                .ownerId(101L)
                .uploadedByUserId(101L)
                .title("Patient A Medical File")
                .storageKey("keys/docA.pdf")
                .branchId(1L)
                .status("ACTIVE")
                .build();

        documentB = Document.builder()
                .id(2L)
                .ownerType("PATIENT")
                .ownerId(102L)
                .uploadedByUserId(102L)
                .title("Patient B Sensitive File")
                .storageKey("keys/docB.pdf")
                .branchId(1L)
                .status("ACTIVE")
                .build();
    }

    @Test
    void testGetDocumentForUser_PatientA_CanAccessOwnDocument() {
        when(documentRepository.findById(1L)).thenReturn(Optional.of(documentA));

        Document doc = documentService.getDocumentForUser(1L, patientA);

        assertNotNull(doc);
        assertEquals("Patient A Medical File", doc.getTitle());
    }

    @Test
    void testGetDocumentForUser_PatientA_CannotAccessPatientBDocument_ThrowsAccessDenied() {
        when(documentRepository.findById(2L)).thenReturn(Optional.of(documentB));
        when(shareRepository.findByDocumentIdAndSharedWithUserId(2L, 101L)).thenReturn(Collections.emptyList());

        assertThrows(AccessDeniedException.class, () -> documentService.getDocumentForUser(2L, patientA));
    }

    @Test
    void testGetDocumentForUser_PatientA_CanAccessExplicitlySharedDocumentB() {
        when(documentRepository.findById(2L)).thenReturn(Optional.of(documentB));

        DocumentShare validShare = DocumentShare.builder()
                .id(10L)
                .document(documentB)
                .sharedWithUserId(101L)
                .permissionLevel("VIEW")
                .build();

        when(shareRepository.findByDocumentIdAndSharedWithUserId(2L, 101L))
                .thenReturn(List.of(validShare));

        Document doc = documentService.getDocumentForUser(2L, patientA);

        assertNotNull(doc);
        assertEquals(2L, doc.getId());
    }

    @Test
    void testGetDocumentForUser_Doctor_CanAccessBranchDocument() {
        when(documentRepository.findById(2L)).thenReturn(Optional.of(documentB));

        Document doc = documentService.getDocumentForUser(2L, doctor);

        assertNotNull(doc);
        assertEquals(2L, doc.getId());
    }

    @Test
    void testCheckDocumentOwnership_PatientA_CannotDeletePatientBDocument() {
        assertThrows(AccessDeniedException.class, () -> documentService.checkDocumentOwnership(documentB, patientA));
    }

    @Test
    void testCheckDocumentOwnership_PatientA_CanModifyOwnDocument() {
        assertDoesNotThrow(() -> documentService.checkDocumentOwnership(documentA, patientA));
    }

    @Test
    void testPatientB_AccessOwnDocument_Success() {
        when(documentRepository.findById(2L)).thenReturn(Optional.of(documentB));
        Document doc = documentService.getDocumentForUser(2L, patientB);
        assertNotNull(doc);
        assertEquals(documentB, doc);
    }
}
