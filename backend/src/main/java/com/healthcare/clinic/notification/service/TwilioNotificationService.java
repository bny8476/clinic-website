package com.healthcare.clinic.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * TwilioNotificationService - STUBBED (Twilio SDK removed for Render deployment).
 * All methods are no-ops. Re-enable by restoring the twilio dependency and
 * the original implementation.
 */
@Service
@Slf4j
public class TwilioNotificationService {

    public void sendAppointmentConfirmationSms(String patientPhone, String doctorName, String startTime) {
        log.info("[STUB] sendAppointmentConfirmationSms disabled - Twilio removed. phone={}, doctor={}, time={}", patientPhone, doctorName, startTime);
    }

    public void sendAppointmentCancellationSms(String patientPhone, String doctorName, String startTime) {
        log.info("[STUB] sendAppointmentCancellationSms disabled - Twilio removed. phone={}, doctor={}, time={}", patientPhone, doctorName, startTime);
    }

    public void sendInvoiceCreatedSms(String patientPhone, String invoiceNumber, String totalAmount, String dueDate) {
        log.info("[STUB] sendInvoiceCreatedSms disabled - Twilio removed. phone={}, invoice={}", patientPhone, invoiceNumber);
    }

    public void sendLabResultReleasedSms(String patientPhone, String testName) {
        log.info("[STUB] sendLabResultReleasedSms disabled - Twilio removed. phone={}, test={}", patientPhone, testName);
    }

    public void sendQueueTokenCalledSms(String patientPhone, Integer tokenNumber, String branchName) {
        log.info("[STUB] sendQueueTokenCalledSms disabled - Twilio removed. phone={}, token={}, branch={}", patientPhone, tokenNumber, branchName);
    }
}