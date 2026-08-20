package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.doctor.dto.PrescriptionRefillRequestDTO;
import com.healthcare.clinic.doctor.dto.PrescriptionRefillRequestPayload;
import com.healthcare.clinic.doctor.entity.Prescription;
import com.healthcare.clinic.doctor.entity.PrescriptionRefillRequest;
import com.healthcare.clinic.doctor.repository.PrescriptionRefillRequestRepository;
import com.healthcare.clinic.doctor.repository.PrescriptionRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.identity.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionRefillService {

    private final PrescriptionRefillRequestRepository refillRequestRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;

    @Transactional
    public PrescriptionRefillRequestDTO requestRefill(Long patientId, PrescriptionRefillRequestPayload payload) {
        Prescription prescription = prescriptionRepository.findById(payload.getPrescriptionId())
                .orElseThrow(() -> new IllegalArgumentException("Prescription not found"));

        if (!prescription.getPatientId().equals(patientId)) {
            throw new SecurityException("Unauthorized to request refill for this prescription");
        }

        PrescriptionRefillRequest request = PrescriptionRefillRequest.builder()
                .prescriptionId(prescription.getId())
                .patientId(patientId)
                .status("PENDING")
                .notes(payload.getNotes())
                .requestedAt(LocalDateTime.now())
                .build();

        PrescriptionRefillRequest saved = refillRequestRepository.save(request);
        return mapToDTO(saved, prescription);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionRefillRequestDTO> getPatientRefillRequests(Long patientId) {
        return refillRequestRepository.findByPatientIdOrderByRequestedAtDesc(patientId).stream()
                .map(req -> {
                    Prescription prescription = req.getPrescription();
                    return mapToDTO(req, prescription);
                })
                .collect(Collectors.toList());
    }

    private PrescriptionRefillRequestDTO mapToDTO(PrescriptionRefillRequest entity, Prescription prescription) {
        String doctorName = "Unknown";
        if (prescription != null && prescription.getDoctorId() != null) {
            User doctor = userRepository.findById(prescription.getDoctorId()).orElse(null);
            if (doctor != null) {
                doctorName = doctor.getFirstName() + " " + doctor.getLastName();
            }
        }
        
        return PrescriptionRefillRequestDTO.builder()
                .id(entity.getId())
                .prescriptionId(entity.getPrescriptionId())
                .patientId(entity.getPatientId())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .requestedAt(entity.getRequestedAt())
                .processedAt(entity.getProcessedAt())
                .processedByDoctorId(entity.getProcessedByDoctorId())
                .doctorName(doctorName)
                .diagnosis(prescription != null ? prescription.getDiagnosis() : null)
                .build();
    }
}
