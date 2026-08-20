package com.healthcare.clinic.nursing.service;

import com.healthcare.clinic.inpatient.entity.Bed;
import com.healthcare.clinic.nursing.entity.BedAssignment;
import com.healthcare.clinic.nursing.entity.WardTransfer;
import com.healthcare.clinic.nursing.repository.BedAssignmentRepository;
import com.healthcare.clinic.nursing.repository.BedRepository;
import com.healthcare.clinic.nursing.repository.WardTransferRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WardTransferService {

    private final WardTransferRepository wardTransferRepository;
    private final BedAssignmentRepository bedAssignmentRepository;
    private final BedRepository bedRepository;

    @Transactional
    public WardTransfer requestTransfer(Long patientId, Long encounterId, Long destinationBedId, String priority, String reason) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        List<BedAssignment> activeAssignments = bedAssignmentRepository.findByPatientIdAndStatus(patientId, "ACTIVE");
        if (activeAssignments.isEmpty()) {
            throw new IllegalStateException("Patient has no active bed assignment to transfer from");
        }
        BedAssignment currentAssignment = activeAssignments.get(0);

        if (destinationBedId != null) {
            Bed destBed = bedRepository.findById(destinationBedId).orElseThrow();
            if (!"AVAILABLE".equals(destBed.getStatus())) {
                throw new IllegalStateException("Destination bed is not available");
            }
        }

        WardTransfer transfer = WardTransfer.builder()
                .patientId(patientId)
                .encounterId(encounterId)
                .sourceBedId(currentAssignment.getBedId())
                .destinationBedId(destinationBedId)
                .requestedBy(currentUserId)
                .priority(priority)
                .reason(reason)
                .status("REQUESTED")
                .build();

        return wardTransferRepository.save(transfer);
    }

    @Transactional
    public WardTransfer approveTransfer(Long transferId, Long approvedBedId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        WardTransfer transfer = wardTransferRepository.findById(transferId).orElseThrow();

        if (!"REQUESTED".equals(transfer.getStatus())) {
            throw new IllegalStateException("Transfer is not in requested state");
        }

        Long finalBedId = approvedBedId != null ? approvedBedId : transfer.getDestinationBedId();
        if (finalBedId == null) {
            throw new IllegalArgumentException("A destination bed must be specified to approve the transfer");
        }

        Bed destBed = bedRepository.findById(finalBedId).orElseThrow();
        if (!"AVAILABLE".equals(destBed.getStatus())) {
            throw new IllegalStateException("Destination bed is not available");
        }
        
        // Reserve the bed
        destBed.setStatus("RESERVED");
        bedRepository.save(destBed);

        transfer.setDestinationBedId(finalBedId);
        transfer.setApprovedBy(currentUserId);
        transfer.setApprovedAt(ZonedDateTime.now());
        transfer.setStatus("APPROVED");

        return wardTransferRepository.save(transfer);
    }

    @Transactional
    public WardTransfer completeTransfer(Long transferId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        WardTransfer transfer = wardTransferRepository.findById(transferId).orElseThrow();

        if (!"APPROVED".equals(transfer.getStatus()) && !"IN_TRANSIT".equals(transfer.getStatus())) {
            throw new IllegalStateException("Transfer cannot be completed from current state");
        }

        // Find active assignment
        List<BedAssignment> activeAssignments = bedAssignmentRepository.findByPatientIdAndStatus(transfer.getPatientId(), "ACTIVE");
        if (!activeAssignments.isEmpty()) {
            BedAssignment currentAssignment = activeAssignments.get(0);
            currentAssignment.setStatus("TRANSFERRED");
            currentAssignment.setDischargedAt(ZonedDateTime.now());
            bedAssignmentRepository.save(currentAssignment);

            Bed sourceBed = bedRepository.findById(currentAssignment.getBedId()).orElseThrow();
            sourceBed.setStatus("CLEANING");
            bedRepository.save(sourceBed);
        }

        // Assign to new bed
        Bed destBed = bedRepository.findById(transfer.getDestinationBedId()).orElseThrow();
        destBed.setStatus("OCCUPIED");
        bedRepository.save(destBed);

        BedAssignment newAssignment = BedAssignment.builder()
                .bedId(transfer.getDestinationBedId())
                .patientId(transfer.getPatientId())
                .encounterId(transfer.getEncounterId())
                .assignedBy(currentUserId)
                .status("ACTIVE")
                .notes("Transferred from Bed " + transfer.getSourceBedId())
                .build();
        bedAssignmentRepository.save(newAssignment);

        transfer.setStatus("COMPLETED");
        return wardTransferRepository.save(transfer);
    }
}
