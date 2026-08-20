package com.healthcare.clinic.nursing.service;

import com.healthcare.clinic.nursing.dto.MonitoredPatientDTO;
import com.healthcare.clinic.inpatient.entity.Bed;
import com.healthcare.clinic.nursing.entity.BedAssignment;
import com.healthcare.clinic.nursing.repository.BedAssignmentRepository;
import com.healthcare.clinic.nursing.repository.BedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientMonitoringService {

    private final BedAssignmentRepository bedAssignmentRepository;
    private final BedRepository bedRepository;

    @Transactional(readOnly = true)
    public List<MonitoredPatientDTO> getMonitoredPatientsByWard(Long wardId) {
        List<Bed> beds = bedRepository.findByRoomWardId(wardId);
        List<Long> bedIds = beds.stream().map(Bed::getId).toList();
        Map<Long, String> bedNumberMap = beds.stream().collect(Collectors.toMap(Bed::getId, Bed::getBedNumber));

        // Find all active assignments for these beds
        // Since we don't have a direct query for bedIds in the repo, we can do it by iterating or custom query.
        // For simplicity here without custom query in repo:
        return beds.stream()
                .map(b -> bedAssignmentRepository.findByBedIdAndStatus(b.getId(), "ACTIVE").orElse(null))
                .filter(a -> a != null)
                .map(a -> MonitoredPatientDTO.builder()
                        .assignmentId(a.getId())
                        .patientId(a.getPatientId())
                        .encounterId(a.getEncounterId())
                        .bedId(a.getBedId())
                        .bedNumber(bedNumberMap.get(a.getBedId()))
                        .status(a.getStatus())
                        .build())
                .toList();
    }
}
