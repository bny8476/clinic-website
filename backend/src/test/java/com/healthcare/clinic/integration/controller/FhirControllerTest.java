package com.healthcare.clinic.integration.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class FhirControllerTest {

    @InjectMocks
    private FhirController fhirController;

    @Test
    @DisplayName("Upload valid FHIR R4 Bundle -> Parses real Bundle entries accurately")
    void testImportFhirBundleSuccess() {
        String fhirBundleJson = """
                {
                  "resourceType": "Bundle",
                  "type": "collection",
                  "entry": [
                    {
                      "resource": {
                        "resourceType": "Patient",
                        "id": "pat-1",
                        "name": [{"family": "Smith", "given": ["John"]}]
                      }
                    },
                    {
                      "resource": {
                        "resourceType": "Observation",
                        "id": "obs-1",
                        "status": "final",
                        "code": {"text": "Blood Pressure"}
                      }
                    },
                    {
                      "resource": {
                        "resourceType": "Condition",
                        "id": "cond-1",
                        "subject": {"reference": "Patient/pat-1"}
                      }
                    }
                  ]
                }
                """;

        MockMultipartFile file = new MockMultipartFile("file", "fhir_bundle.json", "application/json", fhirBundleJson.getBytes());

        ResponseEntity<Map<String, String>> response = fhirController.importFhirData(file);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("success", response.getBody().get("status"));
        assertEquals("3", response.getBody().get("resourcesImported"));
        assertEquals("1", response.getBody().get("patients"));
        assertEquals("1", response.getBody().get("observations"));
        assertEquals("1", response.getBody().get("conditions"));
    }

    @Test
    @DisplayName("Upload single FHIR Patient resource -> Parses single Patient accurately")
    void testImportSinglePatientSuccess() {
        String fhirPatientJson = """
                {
                  "resourceType": "Patient",
                  "id": "pat-100",
                  "name": [{"family": "Doe", "given": ["Jane"]}]
                }
                """;

        MockMultipartFile file = new MockMultipartFile("file", "patient.json", "application/json", fhirPatientJson.getBytes());

        ResponseEntity<Map<String, String>> response = fhirController.importFhirData(file);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("success", response.getBody().get("status"));
        assertEquals("1", response.getBody().get("resourcesImported"));
        assertEquals("1", response.getBody().get("patients"));
    }

    @Test
    @DisplayName("Upload invalid JSON -> Returns 400 Bad Request with error status")
    void testImportInvalidFhirJsonReturns400() {
        MockMultipartFile file = new MockMultipartFile("file", "bad.json", "application/json", "invalid json string".getBytes());

        ResponseEntity<Map<String, String>> response = fhirController.importFhirData(file);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("error", response.getBody().get("status"));
        assertTrue(response.getBody().get("message").contains("Failed to parse FHIR Bundle"));
    }
}
