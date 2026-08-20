package com.healthcare.clinic.nursing.service;

import com.healthcare.clinic.inpatient.entity.Bed;
import com.healthcare.clinic.nursing.entity.BedAssignment;
import com.healthcare.clinic.inpatient.entity.Ward;
import com.healthcare.clinic.nursing.repository.BedAssignmentRepository;
import com.healthcare.clinic.nursing.repository.BedRepository;
import com.healthcare.clinic.nursing.repository.WardRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BedManagementService {

    private final WardRepository wardRepository;
    private final BedRepository bedRepository;
    private final BedAssignmentRepository bedAssignmentRepository;

    @Transactional(readOnly = true)
    public List<Ward> getWardsByBranch(Long branchId) {
        return wardRepository.findByBranchIdAndIsActiveTrue(branchId);
    }

    @Transactional(readOnly = true)
    public List<Bed> getBedsByWard(Long wardId) {
        return bedRepository.findByRoomWardId(wardId);
    }

    @Transactional(readOnly = true)
    public List<BedAssignment> getActiveAssignmentsByEncounter(Long encounterId) {
        return bedAssignmentRepository.findByEncounterId(encounterId).stream()
                .filter(a -> "ACTIVE".equals(a.getStatus()))
                .toList();
    }

    @Transactional
    public BedAssignment assignBed(Long bedId, Long patientId, Long encounterId, String notes) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));

        if (!"AVAILABLE".equals(bed.getStatus()) && !"CLEANING".equals(bed.getStatus())) {
            throw new IllegalStateException("Bed is not available for assignment");
        }

        // Verify patient doesn't already have an active bed
        List<BedAssignment> existingAssignments = bedAssignmentRepository.findByPatientIdAndStatus(patientId, "ACTIVE");
        if (!existingAssignments.isEmpty()) {
            throw new IllegalStateException("Patient already has an active bed assignment");
        }

        bed.setStatus("OCCUPIED");
        bedRepository.save(bed);

        BedAssignment assignment = BedAssignment.builder()
                .bedId(bedId)
                .patientId(patientId)
                .encounterId(encounterId)
                .assignedBy(currentUserId)
                .status("ACTIVE")
                .notes(notes)
                .build();

        return bedAssignmentRepository.save(assignment);
    }

    @Transactional
    public BedAssignment dischargePatientFromBed(Long assignmentId) {
        BedAssignment assignment = bedAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (!"ACTIVE".equals(assignment.getStatus())) {
            throw new IllegalStateException("Assignment is not active");
        }

        assignment.setStatus("DISCHARGED");
        assignment.setDischargedAt(ZonedDateTime.now());
        bedAssignmentRepository.save(assignment);

        Bed bed = bedRepository.findById(assignment.getBedId())
                .orElseThrow(() -> new IllegalStateException("Bed not found"));
        bed.setStatus("CLEANING");
        bedRepository.save(bed);

        return assignment;
    }
}
