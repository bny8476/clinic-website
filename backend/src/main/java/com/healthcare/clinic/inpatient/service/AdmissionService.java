package com.healthcare.clinic.inpatient.service;

import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.inpatient.entity.Admission;
import com.healthcare.clinic.inpatient.entity.Bed;
import com.healthcare.clinic.inpatient.entity.BedTransfer;
import com.healthcare.clinic.inpatient.entity.DischargeSummary;
import com.healthcare.clinic.inpatient.repository.AdmissionRepository;
import com.healthcare.clinic.inpatient.repository.BedRepository;
import com.healthcare.clinic.inpatient.repository.BedTransferRepository;
import com.healthcare.clinic.inpatient.repository.DischargeSummaryRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdmissionService {

    private final AdmissionRepository admissionRepository;
    private final BedRepository bedRepository;
    private final BedTransferRepository bedTransferRepository;
    private final DischargeSummaryRepository dischargeSummaryRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Admission> getAdmissions(Long branchId, String status) {
        if (status != null && !status.isEmpty()) {
            return admissionRepository.findByBranchIdAndStatus(branchId, status);
        }
        return admissionRepository.findByBranchId(branchId);
    }

    @Transactional(readOnly = true)
    public Admission getAdmission(Long id) {
        return admissionRepository.findById(id).orElseThrow(() -> new RuntimeException("Admission not found"));
    }

    @Transactional
    public Admission admitPatient(Long patientId, Long doctorId, Long bedId, String admissionType, String reason, Long branchId) {
        PatientProfile patient = patientProfileRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        DoctorProfile doctor = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Bed bed = bedRepository.findByIdWithLock(bedId)
                .orElseThrow(() -> new RuntimeException("Bed not found"));

        if (!"AVAILABLE".equals(bed.getStatus())) {
            throw new RuntimeException("Bed is not available.");
        }

        bed.setStatus("OCCUPIED");
        bedRepository.save(bed);

        String admissionNumber = "IPD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Admission admission = Admission.builder()
                .admissionNumber(admissionNumber)
                .patient(patient)
                .admittingDoctor(doctor)
                .bed(bed)
                .admissionType(admissionType)
                .status("ADMITTED")
                .admissionReason(reason)
                .branchId(branchId)
                .build();

        return admissionRepository.save(admission);
    }

    @Transactional
    public BedTransfer transferBed(Long admissionId, Long newBedId, String reason, UserPrincipal transferringUserPrincipal) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new RuntimeException("Admission not found"));

        if (!"ADMITTED".equals(admission.getStatus())) {
            throw new RuntimeException("Patient is not currently admitted.");
        }

        Bed oldBed = admission.getBed();
        Bed newBed = bedRepository.findByIdWithLock(newBedId)
                .orElseThrow(() -> new RuntimeException("New bed not found"));

        if (!"AVAILABLE".equals(newBed.getStatus())) {
            throw new RuntimeException("New bed is not available.");
        }

        oldBed.setStatus("CLEANING");
        newBed.setStatus("OCCUPIED");
        
        bedRepository.save(oldBed);
        bedRepository.save(newBed);

        admission.setBed(newBed);
        admissionRepository.save(admission);

        User transferringUser = transferringUserPrincipal != null && transferringUserPrincipal.getUserId() != null
                ? userRepository.findById(transferringUserPrincipal.getUserId()).orElse(null)
                : null;

        BedTransfer transfer = BedTransfer.builder()
                .admission(admission)
                .fromBed(oldBed)
                .toBed(newBed)
                .reason(reason)
                .transferredBy(transferringUser)
                .build();

        return bedTransferRepository.save(transfer);
    }

    @Transactional
    public DischargeSummary dischargePatient(Long admissionId, Long dischargingDoctorId, DischargeSummary summaryData) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new RuntimeException("Admission not found"));

        if (!"ADMITTED".equals(admission.getStatus())) {
            throw new RuntimeException("Patient is not currently admitted.");
        }

        DoctorProfile doctor = doctorProfileRepository.findById(dischargingDoctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        admission.setStatus("DISCHARGED");
        admission.setDischargedAt(ZonedDateTime.now());
        
        Bed bed = admission.getBed();
        bed.setStatus("CLEANING");
        bedRepository.save(bed);

        admissionRepository.save(admission);

        summaryData.setAdmission(admission);
        summaryData.setDischargingDoctor(doctor);
        
        return dischargeSummaryRepository.save(summaryData);
    }
}
