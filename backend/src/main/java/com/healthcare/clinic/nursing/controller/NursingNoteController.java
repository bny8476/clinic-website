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
import java.util.Map;

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
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserPrincipal nursePrincipal) {

        PatientProfile patient = patientProfileRepository.findById(patientId).orElse(null);
        if (patient == null) return ResponseEntity.notFound().build();

        // Accept 'content' or 'note' field from the request body
        String noteText = payload.containsKey("content")
                ? String.valueOf(payload.get("content"))
                : payload.containsKey("note")
                    ? String.valueOf(payload.get("note"))
                    : null;

        if (noteText == null || noteText.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Note content cannot be empty"));
        }

        User nurse = nursePrincipal != null && nursePrincipal.getUserId() != null
                ? userRepository.findById(nursePrincipal.getUserId()).orElse(null)
                : null;

        String noteType = payload.containsKey("noteType")
                ? String.valueOf(payload.get("noteType"))
                : "GENERAL";

        NursingNote note = NursingNote.builder()
                .patient(patient)
                .nurse(nurse)
                .note(noteText)
                .noteType(noteType)
                .recordedAt(ZonedDateTime.now())
                .build();

        return ResponseEntity.ok(nursingNoteRepository.save(note));
    }
}
