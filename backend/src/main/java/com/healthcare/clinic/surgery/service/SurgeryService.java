package com.healthcare.clinic.surgery.service;

import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.inpatient.entity.Admission;
import com.healthcare.clinic.inpatient.repository.AdmissionRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.surgery.entity.*;
import com.healthcare.clinic.surgery.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SurgeryService {

    private final OperationTheatreRepository otRepository;
    private final SurgeryBookingRepository bookingRepository;
    private final PreOpChecklistRepository checklistRepository;
    private final SurgicalTeamMemberRepository teamMemberRepository;
    private final AnesthesiaRecordRepository anesthesiaRecordRepository;
    private final SurgeryNoteRepository surgeryNoteRepository;
    private final PatientProfileRepository patientRepository;
    private final DoctorProfileRepository doctorRepository;
    private final AdmissionRepository admissionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<OperationTheatre> getTheatres(Long branchId) {
        return otRepository.findByBranchId(branchId);
    }

    @Transactional(readOnly = true)
    public List<SurgeryBooking> getBookings(Long branchId, String status) {
        if (status != null && !status.isEmpty()) {
            return bookingRepository.findByBranchIdAndStatus(branchId, status);
        }
        return bookingRepository.findByBranchId(branchId);
    }

    @Transactional
    public SurgeryBooking scheduleSurgery(Long patientId, Long surgeonId, Long otId, Long admissionId, String surgeryType, String diagnosis, ZonedDateTime startTime, Integer durationMinutes) {
        PatientProfile patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        DoctorProfile surgeon = doctorRepository.findById(surgeonId)
                .orElseThrow(() -> new RuntimeException("Surgeon not found"));

        OperationTheatre ot = otRepository.findById(otId)
                .orElseThrow(() -> new RuntimeException("OT not found"));

        Admission admission = null;
        if (admissionId != null) {
            admission = admissionRepository.findById(admissionId).orElse(null);
        }

        ZonedDateTime endTime = startTime.plusMinutes(durationMinutes);
        List<SurgeryBooking> overlaps = bookingRepository.findOverlappingBookings(otId, startTime, endTime);
        if (!overlaps.isEmpty()) {
            throw new RuntimeException("Operation theatre is already booked during this time");
        }

        SurgeryBooking booking = SurgeryBooking.builder()
                .patient(patient)
                .primarySurgeon(surgeon)
                .operationTheatre(ot)
                .admission(admission)
                .surgeryType(surgeryType)
                .diagnosis(diagnosis)
                .scheduledStartTime(startTime)
                .estimatedDurationMinutes(durationMinutes)
                .status("SCHEDULED")
                .build();

        return bookingRepository.save(booking);
    }

    @Transactional
    public PreOpChecklist savePreOpChecklist(Long bookingId, Map<String, Boolean> checklistData, String notes, UserPrincipal completedByPrincipal) {
        SurgeryBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        PreOpChecklist checklist = checklistRepository.findBySurgeryBookingId(bookingId)
                .orElse(PreOpChecklist.builder().surgeryBooking(booking).build());

        User completedBy = completedByPrincipal != null && completedByPrincipal.getUserId() != null
                ? userRepository.findById(completedByPrincipal.getUserId()).orElse(null)
                : null;

        checklist.setCompletedBy(completedBy);
        checklist.setChecklistData(checklistData);
        checklist.setNotes(notes);

        return checklistRepository.save(checklist);
    }
    
    @Transactional
    public SurgeryBooking updateStatus(Long bookingId, String status) {
        SurgeryBooking booking = bookingRepository.findByIdWithLock(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        booking.setStatus(status);
        if ("IN_PROGRESS".equals(status) && booking.getActualStartTime() == null) {
            booking.setActualStartTime(ZonedDateTime.now());
        } else if ("COMPLETED".equals(status) && booking.getActualEndTime() == null) {
            booking.setActualEndTime(ZonedDateTime.now());
        }

        return bookingRepository.save(booking);
    }
    
    @Transactional
    public SurgeryNote saveSurgeryNote(Long bookingId, Long surgeonId, String preOpDiagnosis, String postOpDiagnosis, String procedurePerformed, String findings, String complications) {
        SurgeryBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        DoctorProfile surgeon = doctorRepository.findById(surgeonId)
                .orElseThrow(() -> new RuntimeException("Surgeon not found"));

        SurgeryNote note = surgeryNoteRepository.findBySurgeryBookingId(bookingId)
                .orElse(SurgeryNote.builder().surgeryBooking(booking).build());

        note.setSurgeon(surgeon);
        note.setPreOpDiagnosis(preOpDiagnosis);
        note.setPostOpDiagnosis(postOpDiagnosis);
        note.setProcedurePerformed(procedurePerformed);
        note.setFindings(findings);
        note.setComplications(complications);

        return surgeryNoteRepository.save(note);
    }
}
