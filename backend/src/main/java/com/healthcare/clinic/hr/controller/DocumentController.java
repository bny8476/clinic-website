package com.healthcare.clinic.hr.controller;

import com.healthcare.clinic.hr.entity.StaffDocument;
import com.healthcare.clinic.hr.repository.EmployeeRepository;
import com.healthcare.clinic.hr.repository.StaffDocumentRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController("hrDocumentController")
@RequestMapping("/api/hr/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final StaffDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    // Simple local storage for MVP
    private final String UPLOAD_DIR = "uploads/documents/";

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_HR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<StaffDocument>> getAllDocuments(@RequestParam(required = false) Long staffId) {
        if (staffId != null) {
            return ResponseEntity.ok(documentRepository.findByStaffIdOrderByCreatedAtDesc(staffId));
        }
        return ResponseEntity.ok(documentRepository.findAll());
    }

    @GetMapping("/{staffId}")
    @PreAuthorize("hasAuthority('ROLE_HR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<StaffDocument>> getStaffDocuments(@PathVariable Long staffId) {
        return ResponseEntity.ok(documentRepository.findByStaffIdOrderByCreatedAtDesc(staffId));
    }

    @GetMapping("/{documentId}/download")
    @PreAuthorize("hasAuthority('ROLE_HR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long documentId) throws IOException {
        StaffDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        Path filePath = Paths.get(document.getFilePath());
        if (!Files.exists(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found on disk");
        }

        Resource resource = new UrlResource(filePath.toUri());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFilename() + "\"")
                .body(resource);
    }

    @PostMapping("/{staffId}/upload")
    @PreAuthorize("hasAuthority('ROLE_HR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<StaffDocument> uploadDocument(
            @PathVariable Long staffId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType) throws IOException {

        User staff = userRepository.findById(staffId)
                .orElseGet(() -> employeeRepository.findById(staffId)
                        .map(emp -> emp.getUser())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff user not found with ID: " + staffId)));

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        StaffDocument document = StaffDocument.builder()
                .staff(staff)
                .documentType(documentType)
                .filename(file.getOriginalFilename())
                .filePath(filePath.toString())
                .uploadedBy(SecurityUtils.getCurrentUserId())
                .build();

        return ResponseEntity.ok(documentRepository.save(document));
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasAuthority('ROLE_HR') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long documentId) throws IOException {
        StaffDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        Path filePath = Paths.get(document.getFilePath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }

        documentRepository.delete(document);
        return ResponseEntity.ok().build();
    }
}
