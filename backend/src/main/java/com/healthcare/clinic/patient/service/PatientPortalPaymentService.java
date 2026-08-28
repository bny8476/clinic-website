package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.patient.entity.PatientPortalPayment;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientPortalPaymentRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientPortalPaymentService {

    private final PatientPortalPaymentRepository paymentRepository;
    private final PatientProfileRepository patientProfileRepository;

    private PatientProfile getPatientProfile(UserPrincipal user) {
        return patientProfileRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Patient profile not found for user"));
    }

    public List<PatientPortalPayment> getPayments(UserPrincipal user) {
        PatientProfile profile = getPatientProfile(user);
        return paymentRepository.findByPatientIdOrderByPaymentDateDesc(profile.getId());
    }

    @Transactional
    public PatientPortalPayment processPayment(UserPrincipal user, PatientPortalPayment payment) {
        PatientProfile profile = getPatientProfile(user);
        payment.setPatientId(profile.getId());
        
        // Mock payment processing logic
        payment.setStatus("Completed");
        payment.setTransactionId("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        
        return paymentRepository.save(payment);
    }
}
