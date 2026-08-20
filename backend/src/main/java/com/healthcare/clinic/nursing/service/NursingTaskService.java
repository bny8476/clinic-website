package com.healthcare.clinic.nursing.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.nursing.dto.MedicationIncidentRequest;
import com.healthcare.clinic.nursing.dto.NursingTaskRequest;
import com.healthcare.clinic.nursing.dto.ShiftHandoverRequest;
import com.healthcare.clinic.nursing.entity.MedicationIncident;
import com.healthcare.clinic.nursing.entity.NursingTask;
import com.healthcare.clinic.nursing.entity.ShiftHandover;
import com.healthcare.clinic.inpatient.entity.Ward;
import com.healthcare.clinic.nursing.repository.MedicationIncidentRepository;
import com.healthcare.clinic.nursing.repository.NursingTaskRepository;
import com.healthcare.clinic.nursing.repository.ShiftHandoverRepository;
import com.healthcare.clinic.nursing.repository.WardRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NursingTaskService {

    private final NursingTaskRepository nursingTaskRepository;
    private final ShiftHandoverRepository shiftHandoverRepository;
    private final MedicationIncidentRepository medicationIncidentRepository;
    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final WardRepository wardRepository;

    @Transactional
    public NursingTask createTask(NursingTaskRequest request) {
        Long nurseId = SecurityUtils.getCurrentUserId();
        User createdBy = userRepository.findById(nurseId).orElseThrow();
        PatientProfile patient = patientProfileRepository.findById(request.getPatientId()).orElseThrow();
        
        User assignedTo = null;
        if (request.getAssignedTo() != null) {
            assignedTo = userRepository.findById(request.getAssignedTo()).orElse(null);
        }

        NursingTask task = NursingTask.builder()
                .patient(patient)
                .encounterId(request.getEncounterId())
                .assignedTo(assignedTo)
                .createdBy(createdBy)
                .taskType(request.getTaskType())
                .description(request.getDescription())
                .dueTime(request.getDueTime())
                .build();
        return nursingTaskRepository.save(task);
    }

    @Transactional
    public NursingTask updateTaskStatus(Long taskId, String status) {
        NursingTask task = nursingTaskRepository.findById(taskId).orElseThrow();
        task.setStatus(status);
        if ("COMPLETED".equalsIgnoreCase(status)) {
            task.setCompletedAt(ZonedDateTime.now());
        }
        return nursingTaskRepository.save(task);
    }

    @Transactional(readOnly = true)
    public List<NursingTask> getMyTasks() {
        Long nurseId = SecurityUtils.getCurrentUserId();
        return nursingTaskRepository.findByAssignedToIdAndStatusOrderByDueTimeAsc(nurseId, "PENDING");
    }

    @Transactional
    public ShiftHandover createShiftHandover(ShiftHandoverRequest request) {
        Long outgoingNurseId = SecurityUtils.getCurrentUserId();
        User outgoingNurse = userRepository.findById(outgoingNurseId).orElseThrow();
        User incomingNurse = userRepository.findById(request.getIncomingNurseId()).orElseThrow();

        Ward ward = null;
        if (request.getWardId() != null) {
            ward = wardRepository.findById(request.getWardId()).orElse(null);
        }

        ShiftHandover handover = ShiftHandover.builder()
                .ward(ward)
                .outgoingNurse(outgoingNurse)
                .incomingNurse(incomingNurse)
                .shiftSummary(request.getShiftSummary())
                .pendingTasks(request.getPendingTasks())
                .criticalPatients(request.getCriticalPatients())
                .build();
        return shiftHandoverRepository.save(handover);
    }

    @Transactional(readOnly = true)
    public List<ShiftHandover> getMyHandovers() {
        Long nurseId = SecurityUtils.getCurrentUserId();
        return shiftHandoverRepository.findByIncomingNurseIdOrderByHandoverTimeDesc(nurseId);
    }

    @Transactional
    public MedicationIncident reportMedicationIncident(MedicationIncidentRequest request) {
        Long nurseId = SecurityUtils.getCurrentUserId();
        User nurse = userRepository.findById(nurseId).orElseThrow();
        PatientProfile patient = patientProfileRepository.findById(request.getPatientId()).orElseThrow();

        MedicationIncident incident = MedicationIncident.builder()
                .patient(patient)
                .nurse(nurse)
                .medicationName(request.getMedicationName())
                .incidentType(request.getIncidentType())
                .incidentTime(request.getIncidentTime())
                .description(request.getDescription())
                .actionTaken(request.getActionTaken())
                .doctorNotified(request.getDoctorNotified() != null ? request.getDoctorNotified() : false)
                .build();
        return medicationIncidentRepository.save(incident);
    }

    @Transactional(readOnly = true)
    public List<MedicationIncident> getPatientIncidents(Long patientId) {
        return medicationIncidentRepository.findByPatientIdOrderByIncidentTimeDesc(patientId);
    }
}
