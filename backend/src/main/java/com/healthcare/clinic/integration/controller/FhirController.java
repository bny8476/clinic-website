package com.healthcare.clinic.integration.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
@Slf4j
public class FhirController {

    private final ObjectMapper objectMapper;

    public FhirController() {
        this.objectMapper = new ObjectMapper();
    }

    @Autowired
    public FhirController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

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
            JsonNode root = objectMapper.readTree(content);

            int total = 0;
            int patients = 0;
            int observations = 0;
            int conditions = 0;

            String resourceType = root.path("resourceType").asText("");
            if ("Bundle".equalsIgnoreCase(resourceType)) {
                JsonNode entries = root.path("entry");
                if (entries.isArray()) {
                    total = entries.size();
                    for (JsonNode entry : entries) {
                        JsonNode resource = entry.path("resource");
                        String type = resource.path("resourceType").asText("");
                        if ("Patient".equalsIgnoreCase(type)) {
                            patients++;
                        } else if ("Observation".equalsIgnoreCase(type)) {
                            observations++;
                        } else if ("Condition".equalsIgnoreCase(type)) {
                            conditions++;
                        }
                    }
                }
            } else {
                total = 1;
                if ("Patient".equalsIgnoreCase(resourceType)) {
                    patients++;
                } else if ("Observation".equalsIgnoreCase(resourceType)) {
                    observations++;
                } else if ("Condition".equalsIgnoreCase(resourceType)) {
                    conditions++;
                }
            }

            Map<String, String> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", "FHIR R4 resource parsed successfully.");
            result.put("resourcesImported", String.valueOf(total));
            result.put("patients", String.valueOf(patients));
            result.put("observations", String.valueOf(observations));
            result.put("conditions", String.valueOf(conditions));

            log.info("Parsed FHIR bundle (total: {}, patients: {}, obs: {}, cond: {})", total, patients, observations, conditions);
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
