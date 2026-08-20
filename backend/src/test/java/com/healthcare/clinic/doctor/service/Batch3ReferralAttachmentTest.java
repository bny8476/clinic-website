package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.doctor.entity.ClinicalAttachment;
import com.healthcare.clinic.doctor.entity.ClinicalMessage;
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
public class Batch3ReferralAttachmentTest {

    @Autowired
    private ClinicalReferralService referralService;

    @Autowired
    private ClinicalAttachmentService attachmentService;

    @Autowired
    private ClinicalMessageService messageService;

    @Test
    public void testCreateReferralAndMessageFlow() {
        // Create a referral
        ClinicalReferral referral = new ClinicalReferral();
        referral.setPatientId(1L);
        referral.setEncounterId(10L);
        referral.setReferringDoctorId(101L);
        referral.setReferredToSpecialty("Cardiology");
        referral.setReferralReason("Consultation for hypertension management");
        referral.setReferralReason("Abnormal ECG");
        
        ClinicalReferral savedReferral = referralService.createReferral(referral);
        assertThat(savedReferral.getId()).isNotNull();
        assertThat(savedReferral.getStatus()).isEqualTo("Draft");

        // Update status to sent
        ClinicalReferral updated = referralService.updateReferralStatus(savedReferral.getId(), "Sent");
        assertThat(updated.getStatus()).isEqualTo("Sent");

        // Send a clinical message
        ClinicalMessage message = new ClinicalMessage();
        message.setSenderId(101L);
        message.setRecipientId(102L); // Cardiologist
        message.setPatientId(1L);
        message.setSubject("Referral for patient 1");
        message.setBody("Please see the attached ECG and referral.");
        
        ClinicalMessage savedMsg = messageService.sendMessage(message);
        assertThat(savedMsg.getId()).isNotNull();
        assertThat(savedMsg.getIsRead()).isFalse();

        // Mark message as read
        messageService.markAsRead(savedMsg.getId());
        List<ClinicalMessage> inbox = messageService.getInbox(102L);
        assertThat(inbox).hasSize(1);
        assertThat(inbox.get(0).getIsRead()).isTrue();
    }

    @Test
    public void testUploadAttachment() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "ecg.pdf", "application/pdf", "dummy content".getBytes());

        ClinicalAttachment attachment = attachmentService.uploadAttachment(
                1L, 10L, 101L, "ECG Report", "Patient requested", file);

        assertThat(attachment.getId()).isNotNull();
        assertThat(attachment.getFilePath()).contains("ecg.pdf");
        assertThat(attachment.getFileSize()).isGreaterThan(0);

        List<ClinicalAttachment> attachments = attachmentService.getAttachmentsForPatient(1L);
        assertThat(attachments).hasSize(1);
    }
}
