package com.healthcare.clinic.document.controller;

import com.healthcare.clinic.audit.annotation.AuditableAction;
import com.healthcare.clinic.document.entity.Document;
import com.healthcare.clinic.document.entity.DocumentShare;
import com.healthcare.clinic.document.entity.DocumentSignature;
import com.healthcare.clinic.document.service.DocumentService;
import com.healthcare.clinic.document.service.DocumentStorageService;
import com.healthcare.clinic.document.service.ShareService;
import com.healthcare.clinic.document.service.SignatureService;
import com.healthcare.clinic.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final SignatureService signatureService;
    private final ShareService shareService;
    private final DocumentStorageService storageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @AuditableAction(module = "DOCUMENT", action = "UPLOAD")
    public ResponseEntity<Document> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("ownerType") String ownerType,
            @RequestParam("ownerId") Long ownerId,
            @RequestParam("documentType") String documentType,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "expiresAt", required = false) String expiresAtStr,
            @AuthenticationPrincipal UserPrincipal user) {

        ZonedDateTime expiresAt = expiresAtStr != null ? ZonedDateTime.parse(expiresAtStr) : null;
        Document doc = documentService.uploadNewDocument(file, ownerType, ownerId, documentType, title, description, expiresAt, user.getBranchId(), user.getUserId());
        return ResponseEntity.ok(doc);
    }

    @PostMapping(value = "/{id}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @AuditableAction(module = "DOCUMENT", action = "UPLOAD_VERSION")
    public ResponseEntity<Document> uploadNewVersion(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal user) {
        Document newVersion = documentService.uploadNewVersion(id, file, user.getUserId());
        return ResponseEntity.ok(newVersion);
    }

    @GetMapping
    @AuditableAction(module = "DOCUMENT", action = "SEARCH")
    public ResponseEntity<Page<Document>> searchDocuments(
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String status,
            Pageable pageable,
            @AuthenticationPrincipal UserPrincipal user) {

        // Basic RBAC: If PATIENT, force ownerId to themselves.
        if (user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            ownerId = user.getUserId();
            ownerType = "PATIENT";
        }
        
        Page<Document> docs = documentService.searchDocuments(ownerType, ownerId, documentType, status, user.getBranchId(), pageable);
        return ResponseEntity.ok(docs);
    }

    @GetMapping("/{id}")
    @AuditableAction(module = "DOCUMENT", action = "VIEW_METADATA")
    public ResponseEntity<Document> getDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocumentById(id));
    }

    @GetMapping("/{id}/download")
    @AuditableAction(module = "DOCUMENT", action = "DOWNLOAD")
    public ResponseEntity<InputStreamResource> downloadDocument(@PathVariable Long id) {
        Document doc = documentService.getDocumentById(id);
        InputStreamResource resource = new InputStreamResource(storageService.downloadFile(doc.getStorageKey()));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getOriginalFilename() + "\"")
                .contentType(MediaType.parseMediaType(doc.getMimeType() != null ? doc.getMimeType() : "application/octet-stream"))
                .contentLength(doc.getFileSizeBytes())
                .body(resource);
    }

    @GetMapping("/{id}/versions")
    @AuditableAction(module = "DOCUMENT", action = "VIEW_HISTORY")
    public ResponseEntity<List<Document>> getVersionHistory(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getVersionHistory(id));
    }

    @DeleteMapping("/{id}")
    @AuditableAction(module = "DOCUMENT", action = "DELETE")
    public ResponseEntity<Void> softDeleteDocument(@PathVariable Long id) {
        documentService.softDeleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sign")
    @AuditableAction(module = "DOCUMENT", action = "SIGN")
    public ResponseEntity<DocumentSignature> signDocument(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            HttpServletRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        
        String ipAddress = request.getRemoteAddr();
        String signatureNote = payload.get("signatureNote");
        DocumentSignature signature = signatureService.signDocument(id, user.getUserId(), ipAddress, signatureNote);
        return ResponseEntity.ok(signature);
    }
    
    @GetMapping("/{id}/signatures")
    @AuditableAction(module = "DOCUMENT", action = "VIEW_SIGNATURES")
    public ResponseEntity<List<DocumentSignature>> getSignatures(@PathVariable Long id) {
        return ResponseEntity.ok(signatureService.getSignaturesForDocument(id));
    }

    @PostMapping("/{id}/share/external")
    @AuditableAction(module = "DOCUMENT", action = "SHARE")
    public ResponseEntity<DocumentShare> createExternalShare(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal user) {
        
        String permission = payload.getOrDefault("permissionLevel", "VIEW");
        String expiresAtStr = payload.get("expiresAt");
        ZonedDateTime expiresAt = expiresAtStr != null ? ZonedDateTime.parse(expiresAtStr) : ZonedDateTime.now().plusDays(7);
        
        DocumentShare share = shareService.createExternalShare(id, permission, expiresAt, user.getUserId());
        return ResponseEntity.ok(share);
    }

    @DeleteMapping("/{id}/share/{shareId}")
    @AuditableAction(module = "DOCUMENT", action = "REVOKE_SHARE")
    public ResponseEntity<Void> revokeShare(@PathVariable Long id, @PathVariable Long shareId) {
        shareService.revokeShare(shareId);
        return ResponseEntity.noContent().build();
    }
}
