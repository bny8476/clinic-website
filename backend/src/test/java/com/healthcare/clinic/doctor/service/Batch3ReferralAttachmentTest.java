package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.doctor.entity.ClinicalAttachment;
import com.healthcare.clinic.doctor.entity.ClinicalMessage;
import com.healthcare.clinic.doctor.entity.ClinicalEncounter;
import com.healthcare.clinic.doctor.entity.EncounterStatus;
import com.healthcare.clinic.emr.entity.ClinicalReferral;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@org.springframework.test.context.ActiveProfiles("test")
public class Batch3ReferralAttachmentTest {

    @Autowired
    private ClinicalReferralService referralService;

    @Autowired
    private ClinicalAttachmentService attachmentService;

    @Autowired
    private ClinicalMessageService messageService;

    @Autowired
    private com.healthcare.clinic.identity.repository.UserRepository userRepository;

    @Autowired
    private com.healthcare.clinic.patient.repository.PatientProfileRepository patientProfileRepository;

    @Autowired
    private com.healthcare.clinic.doctor.repository.ClinicalEncounterRepository encounterRepository;

    @Autowired
    private com.healthcare.clinic.branch.repository.BranchRepository branchRepository;

    private com.healthcare.clinic.patient.entity.PatientProfile testPatient;
    private ClinicalEncounter testEncounter;
    private com.healthcare.clinic.identity.entity.User testDoctor;

    @org.junit.jupiter.api.BeforeEach
    public void setup() {
        com.healthcare.clinic.branch.entity.Branch branch = branchRepository.findAll().stream().findFirst().orElseGet(() -> {
            com.healthcare.clinic.branch.entity.Branch b = new com.healthcare.clinic.branch.entity.Branch();
            b.setName("Ref Branch");
            b.setAddress("123 Main St");
            b.setCity("Test City");
            b.setState("TS");
            b.setCountry("USA");
            b.setPostalCode("12345");
            b.setPhoneNumber("+11234567890");
            b.setEmail("refbranch@test.com");
            b.setTimezone("UTC");
            return branchRepository.save(b);
        });

        com.healthcare.clinic.identity.entity.User patientUser = userRepository.findByEmail("batch3.patient@test.com").orElseGet(() -> {
            com.healthcare.clinic.identity.entity.User u = new com.healthcare.clinic.identity.entity.User();
            u.setEmail("batch3.patient@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("Ref");
            u.setLastName("Patient");
            return userRepository.save(u);
        });

        testPatient = patientProfileRepository.findByUserId(patientUser.getId()).orElseGet(() -> {
            com.healthcare.clinic.patient.entity.PatientProfile p = new com.healthcare.clinic.patient.entity.PatientProfile();
            p.setUserId(patientUser.getId());
            p.setBranchId(branch.getId());
            return patientProfileRepository.save(p);
        });

        testDoctor = userRepository.findByEmail("batch3.doc@test.com").orElseGet(() -> {
            com.healthcare.clinic.identity.entity.User u = new com.healthcare.clinic.identity.entity.User();
            u.setEmail("batch3.doc@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("Dr");
            u.setLastName("Ref");
            return userRepository.save(u);
        });

        ClinicalEncounter enc = new ClinicalEncounter();
        enc.setPatientId(testPatient.getId());
        enc.setDoctorId(testDoctor.getId());
        enc.setBranchId(branch.getId());
        enc.setStatus(EncounterStatus.DRAFT);
        enc.setChiefComplaint("Hypertension");
        testEncounter = encounterRepository.save(enc);
    }

    @Test
    public void testCreateReferralAndMessageFlow() {
        // Create a referral
        ClinicalReferral referral = new ClinicalReferral();
        referral.setPatientId(testPatient.getId());
        referral.setEncounterId(testEncounter.getId());
        referral.setReferringDoctorId(testDoctor.getId());
        referral.setReferredToSpecialty("Cardiology");
        referral.setReferralReason("Consultation for hypertension management");
        referral.setReferralReason("Abnormal ECG");
        referral.setUrgency("ROUTINE");
        
        ClinicalReferral savedReferral = referralService.createReferral(referral);
        assertThat(savedReferral.getId()).isNotNull();
        assertThat(savedReferral.getStatus()).isEqualTo("Draft");

        // Update status to sent
        ClinicalReferral updated = referralService.updateReferralStatus(savedReferral.getId(), "Sent");
        assertThat(updated.getStatus()).isEqualTo("Sent");

        // Send a clinical message
        ClinicalMessage message = new ClinicalMessage();
        message.setSenderId(testDoctor.getId());
        message.setRecipientId(testDoctor.getId()); // Cardiologist
        message.setPatientId(testPatient.getId());
        message.setSubject("Referral for patient 1");
        message.setBody("Please see the attached ECG and referral.");
        
        ClinicalMessage savedMsg = messageService.sendMessage(message);
        assertThat(savedMsg.getId()).isNotNull();
        assertThat(savedMsg.getIsRead()).isFalse();

        // Mark message as read
        messageService.markAsRead(savedMsg.getId());
        List<ClinicalMessage> inbox = messageService.getInbox(testDoctor.getId());
        assertThat(inbox).hasSize(1);
        assertThat(inbox.get(0).getIsRead()).isTrue();
    }

    @Test
    public void testUploadAttachment() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "ecg.pdf", "application/pdf", "dummy content".getBytes());

        ClinicalAttachment attachment = attachmentService.uploadAttachment(
                testPatient.getId(), testEncounter.getId(), testDoctor.getId(), "ECG Report", "Patient requested", file);

        assertThat(attachment.getId()).isNotNull();
        assertThat(attachment.getFilePath()).contains("ecg.pdf");
        assertThat(attachment.getFileSize()).isGreaterThan(0);

        List<ClinicalAttachment> attachments = attachmentService.getAttachmentsForPatient(testPatient.getId());
        assertThat(attachments).hasSize(1);
    }
}
