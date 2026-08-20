package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.doctor.entity.ClinicalEncounter;
import com.healthcare.clinic.doctor.entity.SoapNote;
import com.healthcare.clinic.doctor.repository.SoapNoteRepository;
import com.healthcare.clinic.identity.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SoapNoteService {

    private final SoapNoteRepository soapNoteRepository;
    private final ClinicalEncounterService encounterService;

    public Optional<SoapNote> getSoapNote(Long userId, Long encounterId) {
        // Just verify access
        encounterService.getEncounter(userId, encounterId);
        return soapNoteRepository.findByEncounterId(encounterId);
    }

    @Transactional
    public SoapNote saveSoapNote(Long userId, Long encounterId, SoapNote soapNote) {
        ClinicalEncounter encounter = encounterService.getEncounter(userId, encounterId);
        
        if ("CLOSED".equals(encounter.getStatus()) || "Completed".equals(encounter.getStatus())) {
            throw new RuntimeException("Cannot edit SOAP note for a closed encounter");
        }
        
        Optional<SoapNote> existing = soapNoteRepository.findByEncounterId(encounterId);
        if (existing.isPresent()) {
            SoapNote current = existing.get();
            current.setSubjective(soapNote.getSubjective());
            current.setObjective(soapNote.getObjective());
            current.setAssessment(soapNote.getAssessment());
            current.setPlan(soapNote.getPlan());
            return soapNoteRepository.save(current);
        } else {
            soapNote.setEncounterId(encounterId);
            return soapNoteRepository.save(soapNote);
        }
    }
}
