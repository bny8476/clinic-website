package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.document.service.DocumentStorageService;
import com.healthcare.clinic.patient.entity.PatientDocument;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientDocumentRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientDocumentServiceTest {

    @Mock
    private PatientDocumentRepository documentRepository;

    @Mock
    private PatientProfileRepository patientProfileRepository;

    @Mock
    private DocumentStorageService storageService;

    @InjectMocks
    private PatientDocumentService patientDocumentService;

    private UserPrincipal patientUser;
    private PatientProfile profile;

    @BeforeEach
    void setUp() {
        patientUser = new UserPrincipal(100L, "patient", List.of(new SimpleGrantedAuthority("ROLE_PATIENT")), 1L);
        profile = new PatientProfile();
        profile.setId(50L);
        profile.setUserId(100L);
    }

    @Test
    @DisplayName("Saving document with valid file -> Uploads to storage backend and sets real URL and key")
    void testSaveDocumentWithFile() {
        when(patientProfileRepository.findByUserId(100L)).thenReturn(Optional.of(profile));
        when(storageService.uploadFile(any())).thenReturn("key_123.pdf");
        when(storageService.generateDownloadUrl("key_123.pdf")).thenReturn("https://storage.clinic.com/key_123.pdf");

        PatientDocument doc = new PatientDocument();
        doc.setTitle("Lab Results");

        when(documentRepository.save(any(PatientDocument.class))).thenAnswer(i -> i.getArgument(0));

        MockMultipartFile file = new MockMultipartFile("file", "lab.pdf", "application/pdf", "dummy content".getBytes());
        PatientDocument saved = patientDocumentService.saveDocumentMetadata(patientUser, doc, file);

        assertNotNull(saved);
        assertEquals("key_123.pdf", saved.getStorageKey());
        assertEquals("https://storage.clinic.com/key_123.pdf", saved.getFileUrl());
        verify(storageService).uploadFile(file);
        verify(storageService).generateDownloadUrl("key_123.pdf");
    }

    @Test
    @DisplayName("Saving document without file -> Preserves null fileUrl without injecting fake example.com URLs")
    void testSaveDocumentWithoutFileNoFakeUrl() {
        when(patientProfileRepository.findByUserId(100L)).thenReturn(Optional.of(profile));
        when(documentRepository.save(any(PatientDocument.class))).thenAnswer(i -> i.getArgument(0));

        PatientDocument doc = new PatientDocument();
        doc.setTitle("Metadata Only Record");

        PatientDocument saved = patientDocumentService.saveDocumentMetadata(patientUser, doc, null);

        assertNotNull(saved);
        assertEquals("", saved.getFileUrl(), "File URL must remain empty string when no file is uploaded");
        assertNull(saved.getStorageKey());
        verifyNoInteractions(storageService);
    }
}
