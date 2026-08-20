package com.healthcare.clinic.nursing.service;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.entity.AppointmentStatus;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.nursing.dto.NurseAssignmentResponse;
import com.healthcare.clinic.nursing.entity.NursePatientAssignment;
import com.healthcare.clinic.nursing.entity.VitalSign;
import com.healthcare.clinic.nursing.repository.NursePatientAssignmentRepository;
import com.healthcare.clinic.nursing.repository.VitalSignRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.healthcare.clinic.reception.entity.QueueToken;
import com.healthcare.clinic.reception.repository.QueueTokenRepository;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NursingService {

    private final NursePatientAssignmentRepository assignmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final VitalSignRepository vitalSignRepository;
    private final com.healthcare.clinic.nursing.repository.NursingNoteRepository nursingNoteRepository;
    private final UserRepository userRepository;
    private final QueueTokenRepository queueTokenRepository;
    private final BranchRepository branchRepository;
    private final PatientProfileRepository patientProfileRepository;

    private static final Set<AppointmentStatus> VALID_OP_STATUSES = Set.of(
            AppointmentStatus.BOOKED, AppointmentStatus.CHECKED_IN, AppointmentStatus.WAITING, AppointmentStatus.IN_CONSULTATION, AppointmentStatus.COMPLETED
    );

    private String getUserName(Long userId) {
        if (userId == null) return "Unknown User";
        return userRepository.findById(userId)
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown User");
    }

    private Integer calculateAge(LocalDate dob) {
        if (dob == null) return null;
        return Period.between(dob, LocalDate.now()).getYears();
    }

    public List<NurseAssignmentResponse> getOPAssignments(Long nurseId) {
        List<NursePatientAssignment> assignments = assignmentRepository.findByNurseIdAndStatus(nurseId, "ACTIVE");
        List<NurseAssignmentResponse> responses = new ArrayList<>();

        ZonedDateTime startOfDay = ZonedDateTime.now().toLocalDate().atStartOfDay(ZonedDateTime.now().getZone());
        ZonedDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);

        for (NursePatientAssignment assignment : assignments) {
            Long patientId = assignment.getPatient().getId();

            // Find valid OP appointment for today
            List<Appointment> todayAppointments = appointmentRepository.findByPatientId(patientId).stream()
                    .filter(a -> a.getSlot().getStartTime().isAfter(startOfDay) && a.getSlot().getStartTime().isBefore(endOfDay))
                    .filter(a -> VALID_OP_STATUSES.contains(a.getStatus()))
                    .collect(Collectors.toList());

            if (!todayAppointments.isEmpty()) {
                Appointment validAppointment = todayAppointments.get(0); // Pick the first valid one

                // Get latest vitals
                List<VitalSign> vitals = vitalSignRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
                String vitalsSummary = "No vitals recorded";
                if (!vitals.isEmpty()) {
                    VitalSign latest = vitals.get(0);
                    vitalsSummary = String.format("%s mmHg, %s%% SpO2",
                            latest.getBloodPressure() != null ? latest.getBloodPressure() : "--",
                            latest.getOxygenSaturation() != null ? latest.getOxygenSaturation().toString() : "--");
                }
                
                String tokenNumber = null;
                List<QueueToken> tokens = queueTokenRepository.findByAppointmentId(validAppointment.getId());
                if (!tokens.isEmpty()) {
                    QueueToken latestToken = tokens.get(0); // Assuming ordered by time desc or we just take first
                    tokenNumber = String.valueOf(latestToken.getTokenNumber());
                }

                responses.add(NurseAssignmentResponse.builder()
                        .id(assignment.getId())
                        .patientId(patientId)
                        .patientName(getUserName(assignment.getPatient().getUserId()))
                        .age(calculateAge(assignment.getPatient().getDateOfBirth()))
                        .appointmentReason(validAppointment.getReasonForVisit())
                        .appointmentTime(validAppointment.getSlot().getStartTime())
                        .attendingDoctorName("Dr. " + getUserName(validAppointment.getDoctor().getUserId()))
                        .lastVitalsSummary(vitalsSummary)
                        .status(assignment.getStatus())
                        .insuranceStatus(assignment.getPatient().getInsuranceStatus())
                        .injuryStatus(assignment.getPatient().getInjuryStatus())
                        .tokenNumber(tokenNumber)
                        .build());
            }
        }
        return responses;
    }

    public List<com.healthcare.clinic.nursing.dto.NursingActivityResponse> getRecentActivity(Long nurseId) {
        List<com.healthcare.clinic.nursing.dto.NursingActivityResponse> activityList = new ArrayList<>();

        // Fetch nurse's own events directly
        List<VitalSign> vitals = vitalSignRepository.findByNurseIdOrderByRecordedAtDesc(nurseId);
        List<com.healthcare.clinic.nursing.entity.NursingNote> notes = nursingNoteRepository.findByNurseIdOrderByRecordedAtDesc(nurseId);
        List<NursePatientAssignment> assignments = assignmentRepository.findByNurseIdAndStatus(nurseId, "ACTIVE");

        for (VitalSign v : vitals) {
            activityList.add(com.healthcare.clinic.nursing.dto.NursingActivityResponse.builder()
                    .type("VITALS")
                    .title("Vitals Recorded")
                    .sub(getUserName(v.getPatient().getUserId()))
                    .time(v.getRecordedAt())
                    .icon("HeartPulse")
                    .color("var(--color-danger)")
                    .bg("var(--color-danger-bg)")
                    .build());
        }

        for (com.healthcare.clinic.nursing.entity.NursingNote n : notes) {
            activityList.add(com.healthcare.clinic.nursing.dto.NursingActivityResponse.builder()
                    .type("NOTE")
                    .title("Clinical Note Added")
                    .sub(getUserName(n.getPatient().getUserId()))
                    .time(n.getRecordedAt())
                    .icon("FileText")
                    .color("var(--color-info)")
                    .bg("var(--color-info-bg)")
                    .build());
        }

        for (NursePatientAssignment a : assignments) {
            activityList.add(com.healthcare.clinic.nursing.dto.NursingActivityResponse.builder()
                    .type("ASSIGNED")
                    .title("Patient Assigned")
                    .sub(getUserName(a.getPatient().getUserId()))
                    .time(a.getAssignedAt())
                    .icon("UserCheck")
                    .color("var(--color-success)")
                    .bg("var(--color-success-bg)")
                    .build());
        }

        activityList.sort((a, b) -> b.getTime().compareTo(a.getTime()));

        return activityList.stream().limit(5).collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> generateOPToken(Long nurseId, Long patientId) {
        PatientProfile patient = patientProfileRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));
                
        Long branchId = patient.getBranchId() != null ? patient.getBranchId() : 1L;
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        ZonedDateTime startOfDay = ZonedDateTime.now().toLocalDate().atStartOfDay(ZonedDateTime.now().getZone());
        Integer maxToken = queueTokenRepository.findMaxTokenForBranchToday(branchId, startOfDay).orElse(0);
        
        QueueToken token = QueueToken.builder()
                .branch(branch)
                .tokenNumber(maxToken + 1)
                .status("WAITING")
                .build();
                
        token = queueTokenRepository.save(token);
        
        com.healthcare.clinic.identity.entity.User nurse = userRepository.findById(nurseId)
            .orElseThrow(() -> new RuntimeException("Nurse not found"));
            
        NursePatientAssignment assignment = NursePatientAssignment.builder()
                .nurse(nurse)
                .patient(patient)
                .status("ACTIVE")
                .assignedAt(ZonedDateTime.now())
                .build();
        assignmentRepository.save(assignment);
        
        return java.util.Map.of("tokenId", token.getId(), "tokenNumber", token.getTokenNumber(), "message", "OP Token generated successfully");
    }
}
