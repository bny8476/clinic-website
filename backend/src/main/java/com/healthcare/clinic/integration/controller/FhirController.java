package com.healthcare.clinic.integration.controller;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.parser.IParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hl7.fhir.instance.model.api.IBaseResource;
import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.Condition;
import org.hl7.fhir.r4.model.Observation;
import org.hl7.fhir.r4.model.Patient;
import org.hl7.fhir.r4.model.Resource;
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

    private volatile FhirContext fhirContext;

    private FhirContext getFhirContext() {
        if (fhirContext == null) {
            synchronized (this) {
                if (fhirContext == null) {
                    fhirContext = FhirContext.forR4();
                }
            }
        }
        return fhirContext;
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
            IParser parser = getFhirContext().newJsonParser();
            IBaseResource parsedResource = parser.parseResource(content);

            int totalResources = 0;
            int patientCount = 0;
            int observationCount = 0;
            int conditionCount = 0;

            if (parsedResource instanceof Bundle bundle) {
                for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
                    Resource res = entry.getResource();
                    if (res != null) {
                        totalResources++;
                        if (res instanceof Patient) {
                            patientCount++;
                        } else if (res instanceof Observation) {
                            observationCount++;
                        } else if (res instanceof Condition) {
                            conditionCount++;
                        }
                    }
                }
            } else if (parsedResource instanceof Patient) {
                totalResources = 1;
                patientCount = 1;
            } else if (parsedResource instanceof Observation) {
                totalResources = 1;
                observationCount = 1;
            } else if (parsedResource instanceof Condition) {
                totalResources = 1;
                conditionCount = 1;
            } else if (parsedResource != null) {
                totalResources = 1;
            }

            Map<String, String> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", "FHIR R4 resource parsed successfully.");
            result.put("resourcesImported", String.valueOf(totalResources));
            result.put("patients", String.valueOf(patientCount));
            result.put("observations", String.valueOf(observationCount));
            result.put("conditions", String.valueOf(conditionCount));

            log.info("Successfully parsed FHIR bundle/resource containing {} total resources", totalResources);
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
