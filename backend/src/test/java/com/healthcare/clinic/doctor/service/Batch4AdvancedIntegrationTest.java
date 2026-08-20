package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.doctor.dto.PrescriptionRequest;
import com.healthcare.clinic.doctor.entity.BillingOutbox;
import com.healthcare.clinic.doctor.entity.ClinicalEncounter;
import com.healthcare.clinic.doctor.entity.Prescription;
import com.healthcare.clinic.doctor.repository.BillingOutboxRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;


import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class Batch4AdvancedIntegrationTest {

    @Autowired
    private ClinicalEncounterService encounterService;

    @Autowired
    private BillingOutboxRepository billingOutboxRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.healthcare.clinic.doctor.repository.DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private com.healthcare.clinic.doctor.repository.SoapNoteRepository soapNoteRepository;

    @Test
    public void testFinalizeConsultationFlow() {
        // 1. Create a dummy doctor user
        User doctorUser = new User();
        doctorUser.setEmail("doctor4@clinic.com");
        doctorUser.setFirstName("Doc");
        doctorUser.setLastName("Tor");
        doctorUser.setPasswordHash("hash");
        doctorUser = userRepository.save(doctorUser);

        com.healthcare.clinic.doctor.entity.DoctorProfile docProfile = new com.healthcare.clinic.doctor.entity.DoctorProfile();
        docProfile.setUserId(doctorUser.getId());
        docProfile.setSpecialty("General");
        docProfile.setQualifications("MBBS");
        docProfile.setConsultationFee(new BigDecimal("150.00"));
        docProfile.setBranchId(1L);
        doctorProfileRepository.save(docProfile);
        
        ClinicalEncounter encounter = new ClinicalEncounter();
        encounter.setPatientId(1L);
        encounter.setDoctorId(doctorUser.getId());
        encounter.setBranchId(1L);
        encounter.setStatus(com.healthcare.clinic.doctor.entity.EncounterStatus.DRAFT);
        encounter.setChiefComplaint("Test Complaint");
        
        ClinicalEncounter savedEncounter = encounterService.startEncounter(doctorUser.getId(), encounter);
        Long encounterId = savedEncounter.getId();

        // 2. Add a prescription
        PrescriptionRequest pxReq = new PrescriptionRequest();
        pxReq.setPatientId(1L);
        pxReq.setAppointmentId(null);
        pxReq.setDiagnosis("Test Diagnosis");
        pxReq.setItems(List.of());
        
        // This simulates saving a draft
        Prescription prescription = new Prescription();
        prescription.setPatientId(1L);
        prescription.setDoctorId(101L);
        prescription.setEncounterId(encounterId);
        prescription.setStatus("Draft");
        prescription.setPharmacyStatus("DRAFT");
        // For simplicity, we just save it directly via repo or we can test using an existing method
        // But PrescriptionService saveDraft doesn't take encounterId in request yet. Let's just create one manually or via service if possible.
        // 2.5 Add a SOAP note to allow closing the encounter
        com.healthcare.clinic.doctor.entity.SoapNote note = new com.healthcare.clinic.doctor.entity.SoapNote();
        note.setEncounterId(encounterId);
        note.setSubjective("Complains of pain");
        note.setObjective("Temp 99F");
        note.setAssessment("Mild fever");
        note.setPlan("Rest");
        // Save via repository or service if available. We can just use a repository if injected or manually save via entity manager.
        // Actually we don't have SoapNoteRepository injected in this test, but let's inject it.
        soapNoteRepository.save(note);
        
        // 3. Finalize Encounter
        ClinicalEncounter closed = encounterService.closeEncounter(doctorUser.getId(), encounterId);
        
        assertThat(closed.getStatus()).isEqualTo("CLOSED");
        assertThat(closed.getFinalizedAt()).isNotNull();

        // 4. Verify BillingOutbox
        List<BillingOutbox> outboxItems = billingOutboxRepository.findByEncounterId(encounterId);
        assertThat(outboxItems).hasSize(1);
        
        BillingOutbox outbox = outboxItems.get(0);
        assertThat(outbox.getServiceType()).isEqualTo("Consultation");
        assertThat(outbox.getAmount()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(outbox.getStatus()).isEqualTo("Pending");
    }
}
