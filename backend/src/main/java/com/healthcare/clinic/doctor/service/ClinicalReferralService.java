package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.emr.entity.ClinicalReferral;
import com.healthcare.clinic.doctor.repository.ClinicalReferralRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClinicalReferralService {

    private final ClinicalReferralRepository referralRepository;

    @Transactional
    public ClinicalReferral createReferral(ClinicalReferral referral) {
        if (referral.getStatus() == null || referral.getStatus().isBlank()) {
            referral.setStatus("Draft");
        }
        return referralRepository.save(referral);
    }

    public List<ClinicalReferral> getReferralsForPatient(Long patientId) {
        return referralRepository.findByPatientId(patientId);
    }

    public List<ClinicalReferral> getReferralsForEncounter(Long encounterId) {
        return referralRepository.findByEncounterId(encounterId);
    }

    @Transactional
    public ClinicalReferral updateReferralStatus(Long referralId, String newStatus) {
        ClinicalReferral referral = referralRepository.findById(referralId)
                .orElseThrow(() -> new RuntimeException("Referral not found"));
        referral.setStatus(newStatus);
        return referralRepository.save(referral);
    }
}
