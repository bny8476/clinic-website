package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.patient.entity.PatientDocument;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientDocumentRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.document.service.DocumentStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientDocumentService {

    private final PatientDocumentRepository documentRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DocumentStorageService storageService;

    private PatientProfile getPatientProfile(UserPrincipal user) {
        return patientProfileRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Patient profile not found for user"));
    }

    public List<PatientDocument> getPatientDocuments(UserPrincipal user) {
        PatientProfile profile = getPatientProfile(user);
        return documentRepository.findByPatientIdOrderByUploadedAtDesc(profile.getId());
    }

    @Transactional
    public PatientDocument saveDocumentMetadata(UserPrincipal user, PatientDocument document, MultipartFile file) {
        PatientProfile profile = getPatientProfile(user);
        
        document.setPatientId(profile.getId());
        
        if (file != null && !file.isEmpty()) {
            String storageKey = storageService.uploadFile(file);
            document.setFileUrl(storageService.generateDownloadUrl(storageKey));
            document.setStorageKey(storageKey);
        } else if (document.getFileUrl() == null) {
            document.setFileUrl("");
        }

        return documentRepository.save(document);
    }
}
