package com.healthcare.clinic.pharmacy.controller;

import jakarta.validation.Valid;

import com.healthcare.clinic.pharmacy.entity.PharmacyPatient;
import com.healthcare.clinic.common.dto.ApiResponse;
import com.healthcare.clinic.pharmacy.repository.PharmacyPatientRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController("pharmacyPatientController")
@RequestMapping("/api/pharmacy/patients")
public class PharmacyPatientController {

    private final PharmacyPatientRepository patientRepository;

    public PharmacyPatientController(PharmacyPatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','ROLE_DOCTOR','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<PharmacyPatient>>> getAllPatients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(patientRepository.findAll(pageable), "Patients fetched"));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','ROLE_DOCTOR','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<PharmacyPatient>>> searchPatients(@RequestParam String query) {
        java.util.List<PharmacyPatient> patients = patientRepository.findByNameContainingIgnoreCaseOrUhidContainingIgnoreCase(query, query);
        return ResponseEntity.ok(ApiResponse.success(patients, "Patients fetched"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PharmacyPatient>> createPatient(@Valid @RequestBody PharmacyPatient patient) {
        // Save first to get ID for UHID generation
        patient.setUhid("PENDING");
        PharmacyPatient saved = patientRepository.save(patient);
        
        // Generate UHID: UHID-000001
        String uhid = "UHID-" + String.format("%06d", saved.getId());
        saved.setUhid(uhid);
        
        return ResponseEntity.ok(ApiResponse.success(patientRepository.save(saved), "Patient registered"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PharmacyPatient>> updatePatient(@PathVariable Long id, @Valid @RequestBody PharmacyPatient patientDetails) {
        PharmacyPatient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        patient.setName(patientDetails.getName());
        patient.setDob(patientDetails.getDob());
        patient.setGender(patientDetails.getGender());
        patient.setPhone(patientDetails.getPhone());
        patient.setAddress(patientDetails.getAddress());
        patient.setInsuranceId(patientDetails.getInsuranceId());
        patient.setPreferredDelivery(patientDetails.getPreferredDelivery());
        patient.setDeliveryAddress(patientDetails.getDeliveryAddress());
        
        return ResponseEntity.ok(ApiResponse.success(patientRepository.save(patient), "Patient updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_PHARMACIST','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable Long id) {
        PharmacyPatient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        patient.setDeleted(true);
        patientRepository.save(patient);
        return ResponseEntity.ok(ApiResponse.success(null, "Patient deleted"));
    }
}
