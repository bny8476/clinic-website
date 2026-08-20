package com.healthcare.clinic.document.controller;

import com.healthcare.clinic.audit.annotation.AuditableAction;
import com.healthcare.clinic.document.entity.Document;
import com.healthcare.clinic.document.entity.DocumentShare;
import com.healthcare.clinic.document.service.DocumentStorageService;
import com.healthcare.clinic.document.service.ShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documents/shared")
@PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_PATIENT') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class DocumentShareController {

    private final ShareService shareService;
    private final DocumentStorageService storageService;

    @GetMapping("/{shareToken}")
    @AuditableAction(module = "DOCUMENT", action = "DOWNLOAD_SHARED") // This will capture IP/Session even without User
    public ResponseEntity<InputStreamResource> downloadSharedDocument(@PathVariable String shareToken) {
        DocumentShare share = shareService.validateAndGetExternalShare(shareToken);
        Document doc = share.getDocument();
        
        InputStreamResource resource = new InputStreamResource(storageService.downloadFile(doc.getStorageKey()));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getOriginalFilename() + "\"")
                .contentType(MediaType.parseMediaType(doc.getMimeType() != null ? doc.getMimeType() : "application/octet-stream"))
                .contentLength(doc.getFileSizeBytes())
                .body(resource);
    }
}
