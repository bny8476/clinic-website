package com.healthcare.clinic.document.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Service
public class FileUploadSecurityService {

    private static final long MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
            "pdf", "png", "jpg", "jpeg", "gif", "webp",
            "docx", "xlsx", "csv", "txt", "json",
            "dcm", "dicom", "wav", "mp3", "ogg", "mp4"
    ));

    private static final Set<String> DANGEROUS_EXTENSIONS = new HashSet<>(Arrays.asList(
            "exe", "sh", "bat", "cmd", "js", "vbs", "py", "pl", "php", "jsp", "asp", "aspx", "svg", "html", "htm", "jar", "war"
    ));

    private static final Set<String> BLOCKED_MIME_TYPES = new HashSet<>(Arrays.asList(
            "application/x-msdownload",
            "application/x-executable",
            "text/html",
            "image/svg+xml",
            "application/x-sh",
            "application/javascript",
            "text/javascript"
    ));

    public void validateFileUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 25MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid filename");
        }

        String sanitizedFilename = sanitizeFilename(originalFilename);
        if (sanitizedFilename.contains("..") || sanitizedFilename.contains("/") || sanitizedFilename.contains("\\")) {
            throw new IllegalArgumentException("Filename contains illegal path traversal characters");
        }

        String extension = getFileExtension(sanitizedFilename).toLowerCase();
        if (DANGEROUS_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("File extension ." + extension + " is strictly prohibited for security reasons");
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("File extension ." + extension + " is not in the permitted healthcare document upload format list");
        }

        String contentType = file.getContentType();
        if (contentType != null && BLOCKED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("MIME type " + contentType + " is not permitted");
        }
    }

    public String sanitizeFilename(String filename) {
        if (filename == null) return "file";
        String nameOnly = new java.io.File(filename).getName();
        nameOnly = nameOnly.replace("..", "_");
        String clean = nameOnly.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (clean.length() > 200) {
            clean = clean.substring(clean.length() - 200);
        }
        return clean.isEmpty() ? "file" : clean;
    }

    private String getFileExtension(String filename) {
        int lastIndex = filename.lastIndexOf('.');
        if (lastIndex == -1 || lastIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastIndex + 1);
    }
}
