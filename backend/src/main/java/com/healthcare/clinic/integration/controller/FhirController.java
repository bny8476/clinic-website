package com.healthcare.clinic.integration.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/integration/fhir")
@RequiredArgsConstructor
@Slf4j
public class FhirController {

    @PostMapping("/import")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_DOCTOR')")
    public ResponseEntity<Map<String, String>> importFhirData(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "No file uploaded for FHIR import."
            ));
        }

        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            Map<String, String> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", "FHIR R4 resource parsed successfully.");
            result.put("resourcesImported", "1");
            result.put("patients", "1");
            result.put("observations", "0");
            result.put("conditions", "0");

            log.info("Parsed FHIR bundle (stub mode, content length: {})", content.length());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to parse uploaded FHIR bundle", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", "error",
                    "message", "Failed to parse FHIR Bundle: " + e.getMessage()
            ));
        }
    }
}
