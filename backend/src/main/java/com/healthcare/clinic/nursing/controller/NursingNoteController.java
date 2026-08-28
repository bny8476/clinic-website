package com.healthcare.clinic.nursing.controller;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.nursing.entity.NursingNote;
import com.healthcare.clinic.nursing.repository.NursingNoteRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.ZonedDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/patients/{patientId}/nursing-notes")
@RequiredArgsConstructor
public class NursingNoteController {

    private final NursingNoteRepository nursingNoteRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("@nursingSecurity.isAssigned(authentication, #patientId) or hasRole('DOCTOR')")
    public ResponseEntity<List<NursingNote>> getNursingNotes(@PathVariable Long patientId) {
        return ResponseEntity.ok(nursingNoteRepository.findByPatientIdOrderByRecordedAtDesc(patientId));
    }

    @PostMapping
    @PreAuthorize("@nursingSecurity.isAssigned(authentication, #patientId)")
    public ResponseEntity<?> addNursingNote(
            @PathVariable Long patientId,
            @RequestBody NursingNote note,
            @AuthenticationPrincipal UserPrincipal nursePrincipal) {
        PatientProfile patient = patientProfileRepository.findById(patientId).orElse(null);
        if (patient == null) return ResponseEntity.notFound().build();

        User nurse = nursePrincipal != null && nursePrincipal.getUserId() != null
                ? userRepository.findById(nursePrincipal.getUserId()).orElse(null)
                : null;

        note.setPatient(patient);
        note.setNurse(nurse);
        note.setRecordedAt(ZonedDateTime.now());
        
        return ResponseEntity.ok(nursingNoteRepository.save(note));
    }
}
