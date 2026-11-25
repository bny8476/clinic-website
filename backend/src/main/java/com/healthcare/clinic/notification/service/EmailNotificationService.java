package com.healthcare.clinic.notification.service;

import com.healthcare.clinic.appointment.event.AppointmentBookedEvent;
import com.healthcare.clinic.notification.event.AppointmentCancelledEvent;
import com.healthcare.clinic.notification.event.InvoiceCreatedEvent;
import com.healthcare.clinic.notification.event.LabResultReleasedEvent;
import com.healthcare.clinic.notification.event.QueueTokenCalledEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.mail.internet.MimeMessage;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailNotificationService {

    private final JavaMailSender emailSender;

    @Value("${spring.mail.username:noreply@healthcareclinic.com}")
    private String defaultFromEmail;

    // ─── Appointment ──────────────────────────────────────────────────────────

    public void sendAppointmentConfirmation(AppointmentBookedEvent event) {
        if (!StringUtils.hasText(event.getPatientEmail())) return;
        String subject = "✅ Appointment Confirmed — HealthCare Clinic";
        String body = buildHtml(
                "Appointment Confirmed",
                String.format("Dear Patient,<br><br>Your appointment with <strong>Dr. %s</strong> has been confirmed.<br>" +
                        "<br><b>Date & Time:</b> %s<br><br>" +
                        "Please arrive 10 minutes early. If you need to cancel or reschedule, contact us at least 24 hours in advance.",
                        event.getDoctorName(), event.getStartTime())
        );
        sendHtmlEmail(event.getPatientEmail(), subject, body);
    }

    public void sendAppointmentCancellation(AppointmentCancelledEvent event) {
        if (!StringUtils.hasText(event.getPatientEmail())) return;
        String subject = "❌ Appointment Cancelled — HealthCare Clinic";
        String body = buildHtml(
                "Appointment Cancelled",
                String.format("Dear Patient,<br><br>Your appointment scheduled for <strong>%s</strong> " +
                        "with <strong>Dr. %s</strong> has been cancelled.<br><br>Please contact us to reschedule.",
                        event.getStartTime(), event.getDoctorName())
        );
        sendHtmlEmail(event.getPatientEmail(), subject, body);
    }

    // ─── Invoice ──────────────────────────────────────────────────────────────

    public void sendInvoiceCreated(InvoiceCreatedEvent event) {
        if (!StringUtils.hasText(event.getPatientEmail())) return;
        String subject = "🧾 Invoice Created — " + event.getInvoiceNumber();
        String body = buildHtml(
                "New Invoice",
                String.format("Dear %s,<br><br>A new invoice has been created for your recent visit.<br>" +
                        "<br><b>Invoice No.:</b> %s<br><b>Amount Due:</b> ₹%s<br><b>Due Date:</b> %s<br><br>" +
                        "Please log in to your patient portal to view and pay your invoice.",
                        event.getPatientName(), event.getInvoiceNumber(),
                        event.getTotalAmount(), event.getDueDate())
        );
        sendHtmlEmail(event.getPatientEmail(), subject, body);
    }

    // ─── Lab Result ───────────────────────────────────────────────────────────

    public void sendLabResultReleased(LabResultReleasedEvent event) {
        if (!StringUtils.hasText(event.getPatientEmail())) return;
        String subject = "🔬 Lab Results Ready — HealthCare Clinic";
        String body = buildHtml(
                "Lab Results Available",
                String.format("Dear %s,<br><br>Your lab test results for <strong>%s</strong> are now available.<br>" +
                        "<br>Please log in to your patient portal or contact your doctor to review the results.",
                        event.getPatientName(), event.getTestName())
        );
        sendHtmlEmail(event.getPatientEmail(), subject, body);
    }

    // ─── Queue ────────────────────────────────────────────────────────────────

    public void sendQueueTokenCalled(QueueTokenCalledEvent event) {
        if (!StringUtils.hasText(event.getPatientEmail())) return;
        String subject = "🔔 Your Turn — Token #" + event.getTokenNumber();
        String body = buildHtml(
                "Your Number is Being Called",
                String.format("Dear Patient,<br><br>Token number <strong>#%d</strong> is now being called at <strong>%s</strong>.<br>" +
                        "<br>Please proceed to the consultation room.",
                        event.getTokenNumber(), event.getBranchName())
        );
        sendHtmlEmail(event.getPatientEmail(), subject, body);
    }

    // ─── Admin Password Reset Notification ────────────────────────────────────

    public void sendAdminPasswordResetNotification(String toEmail, String recipientName, String temporaryPassword, boolean mustChangePassword) {
        if (!StringUtils.hasText(toEmail)) return;
        String subject = "🔐 Security Notice: Your Account Password Has Been Reset";
        String changeNotice = mustChangePassword 
            ? "<p style=\"color:#92400e;background:#fef3c7;border:1px solid #fde68a;padding:12px;border-radius:8px;font-size:0.875rem;margin:16px 0;\"><strong>⚠️ Important Security Requirement:</strong> You will be prompted to choose a new permanent password immediately upon your next login.</p>"
            : "";
        String body = buildHtml(
            "Account Credentials Updated",
            String.format(
                "Dear %s,<br><br>" +
                "An authorized system administrator has reset your clinic account credentials.<br><br>" +
                "Your new temporary password is:<br>" +
                "<div style=\"margin:16px 0;padding:14px 24px;background:#f8fafc;border:2px dashed #94a3b8;border-radius:8px;font-family:monospace;font-size:1.2rem;font-weight:bold;color:#0f172a;letter-spacing:1.5px;display:inline-block;\">%s</div><br>" +
                "%s" +
                "Please sign in to your assigned healthcare portal using this temporary password.<br><br>" +
                "<div style=\"margin:20px 0;\"><a href=\"http://localhost:5173/login\" style=\"background:#2563eb;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-size:0.95rem;\">Sign In to Healthcare Portal</a></div><br>" +
                "<hr style=\"border:none;border-top:1px solid #e2e8f0;margin:24px 0;\">" +
                "<small style=\"color:#64748b;line-height:1.5;display:block;\">If you did not request this reset or were not expecting this notification, please contact your Clinic Administrator or IT Security Desk immediately.</small>",
                recipientName != null && !recipientName.isBlank() ? recipientName : "Healthcare Staff",
                temporaryPassword,
                changeNotice
            )
        );
        sendHtmlEmail(toEmail, subject, body);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(defaultFromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            emailSender.send(message);
            log.info("HTML email sent to {}: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String buildHtml(String heading, String content) {
        return "<!DOCTYPE html><html><body style=\"font-family:Arial,sans-serif;background:#f8fafc;padding:20px;\">" +
               "<div style=\"max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;" +
               "border:1px solid #e2e8f0;\">" +
               "<div style=\"background:#1e3a5f;padding:24px 32px;\">" +
               "<h2 style=\"color:#fff;margin:0;font-size:1.2rem;\">HealthCare Clinic</h2></div>" +
               "<div style=\"padding:32px;\">" +
               "<h3 style=\"color:#1e3a5f;margin-top:0;\">" + heading + "</h3>" +
               "<p style=\"color:#334155;line-height:1.7;\">" + content + "</p>" +
               "</div>" +
               "<div style=\"background:#f1f5f9;padding:16px 32px;text-align:center;\">" +
               "<p style=\"color:#94a3b8;font-size:0.8rem;margin:0;\">© 2025 HealthCare Clinic. All rights reserved.</p>" +
               "</div></div></body></html>";
    }
}
