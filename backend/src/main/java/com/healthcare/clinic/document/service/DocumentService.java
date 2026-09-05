package com.healthcare.clinic.document.service;

import com.healthcare.clinic.document.entity.Document;
import com.healthcare.clinic.document.repository.DocumentRepository;
import com.healthcare.clinic.document.repository.DocumentShareRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentStorageService storageService;

    @Transactional
    public Document uploadNewDocument(MultipartFile file, String ownerType, Long ownerId, String documentType, String title, String description, ZonedDateTime expiresAt, Long branchId, Long uploaderId) {
        String storageKey = storageService.uploadFile(file);

        Document doc = Document.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .documentType(documentType)
                .title(title)
                .description(description)
                .storageKey(storageKey)
                .mimeType(file.getContentType())
                .fileSizeBytes(file.getSize())
                .originalFilename(file.getOriginalFilename())
                .expiresAt(expiresAt)
                .branchId(branchId)
                .uploadedByUserId(uploaderId)
                .build();

        return documentRepository.save(doc);
    }

    @Transactional
    public Document uploadNewVersion(Long parentDocumentId, MultipartFile file, Long uploaderId) {
        Document parent = documentRepository.findById(parentDocumentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent document not found"));

        if (!"ACTIVE".equals(parent.getStatus())) {
            throw new IllegalStateException("Can only add versions to ACTIVE documents.");
        }

        String storageKey = storageService.uploadFile(file);

        // Mark previous version as SUPERSEDED
        parent.setStatus("SUPERSEDED");
        documentRepository.save(parent);

        // Create new version
        Document newVersion = Document.builder()
                .ownerType(parent.getOwnerType())
                .ownerId(parent.getOwnerId())
                .documentType(parent.getDocumentType())
                .title(parent.getTitle())
                .description(parent.getDescription())
                .storageKey(storageKey)
                .mimeType(file.getContentType())
                .fileSizeBytes(file.getSize())
                .originalFilename(file.getOriginalFilename())
                .versionNumber(parent.getVersionNumber() + 1)
                .parentDocument(parent)
                .expiresAt(parent.getExpiresAt())
                .branchId(parent.getBranchId())
                .uploadedByUserId(uploaderId)
                .build();

        return documentRepository.save(newVersion);
    }

    @Transactional(readOnly = true)
    public Page<Document> searchDocuments(String ownerType, Long ownerId, String documentType, String status, Long branchId, Pageable pageable) {
        return documentRepository.searchDocuments(ownerType, ownerId, documentType, status, branchId, pageable);
    }

    private final DocumentShareRepository shareRepository;

    @Transactional(readOnly = true)
    public Document getDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
    }

    @Transactional(readOnly = true)
    public Document getDocumentForUser(Long id, com.healthcare.clinic.security.UserPrincipal user) {
        Document doc = getDocumentById(id);
        checkDocumentAccess(doc, user);
        return doc;
    }

    public void checkDocumentAccess(Document doc, com.healthcare.clinic.security.UserPrincipal user) {
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: User unauthenticated");
        }

        boolean isSuperAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("ROLE_ADMIN"));
        if (isSuperAdmin) {
            return;
        }

        boolean isDoctorOrNurse = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR") ||
                               a.getAuthority().equals("ROLE_NURSE") ||
                               a.getAuthority().equals("ROLE_LAB_TECH"));

        if (isDoctorOrNurse) {
            // Doctors and nurses have access to medical documents within their branch or patient records
            if (doc.getBranchId() != null && user.getBranchId() != null && !doc.getBranchId().equals(user.getBranchId())) {
                // If branch specified and mismatched, check explicit share
                checkExplicitShare(doc.getId(), user.getUserId());
            }
            return;
        }

        // For PATIENTS (or other end users), check explicit ownership or explicit share
        if ("PATIENT".equalsIgnoreCase(doc.getOwnerType()) && doc.getOwnerId().equals(user.getUserId())) {
            return;
        }

        if (doc.getUploadedByUserId() != null && doc.getUploadedByUserId().equals(user.getUserId())) {
            return;
        }

        checkExplicitShare(doc.getId(), user.getUserId());
    }

    public void checkDocumentOwnership(Document doc, com.healthcare.clinic.security.UserPrincipal user) {
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: User unauthenticated");
        }

        boolean isSuperAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("ROLE_ADMIN"));
        if (isSuperAdmin) {
            return;
        }

        if (doc.getUploadedByUserId() != null && doc.getUploadedByUserId().equals(user.getUserId())) {
            return;
        }

        if ("PATIENT".equalsIgnoreCase(doc.getOwnerType()) && doc.getOwnerId().equals(user.getUserId())) {
            return;
        }

        throw new org.springframework.security.access.AccessDeniedException("Access denied: Only document owner or admin can perform this modification.");
    }

    private void checkExplicitShare(Long documentId, Long userId) {
        List<com.healthcare.clinic.document.entity.DocumentShare> shares = shareRepository.findByDocumentIdAndSharedWithUserId(documentId, userId);
        boolean validShare = shares.stream().anyMatch(s ->
                s.getRevokedAt() == null &&
                (s.getExpiresAt() == null || s.getExpiresAt().isAfter(ZonedDateTime.now()))
        );

        if (!validShare) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: You do not have permission to access this document.");
        }
    }

    @Transactional(readOnly = true)
    public List<Document> getVersionHistory(Long id) {
        Document current = getDocumentById(id);
        // If this is a new version, the parent is present.
        // We'll search by parentDocumentId or if this is the root, search where parent is this.
        Long rootId = current.getParentDocument() != null ? current.getParentDocument().getId() : current.getId();
        return documentRepository.findByParentDocumentIdOrderByVersionNumberDesc(rootId);
    }

    @Transactional
    public void softDeleteDocument(Long id) {
        Document doc = getDocumentById(id);
        doc.setStatus("DELETED");
        documentRepository.save(doc);
        // We don't delete from storage because it's a medical record soft delete.
    }
}
