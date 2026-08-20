package com.healthcare.clinic.patient.service;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.patient.dto.TimelineEventDTO;
import com.healthcare.clinic.patient.entity.HomeVisitRequest;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.entity.PatientDocument;
import com.healthcare.clinic.homevisit.repository.HomeVisitRequestRepository;
import com.healthcare.clinic.patient.repository.PatientDocumentRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;
import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import com.healthcare.clinic.laboratory.entity.LabResult;
import com.healthcare.clinic.laboratory.repository.LabResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HealthTimelineService {

    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final HomeVisitRequestRepository homeVisitRequestRepository;
    private final PatientDocumentRepository patientDocumentRepository;
    private final LabTestRequestRepository labTestRequestRepository;
    private final LabResultRepository labResultRepository;

    private PatientProfile getPatientProfile(User user) {
        return patientProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Patient profile not found for user"));
    }

    public List<TimelineEventDTO> getTimelineEvents(User user) {
        PatientProfile profile = getPatientProfile(user);
        List<TimelineEventDTO> events = new ArrayList<>();

        // 1. Appointments
        List<Appointment> appointments = appointmentRepository.findByPatientId(profile.getId());
        for (Appointment appt : appointments) {
            events.add(TimelineEventDTO.builder()
                    .id("APPT-" + appt.getId())
                    .type("APPOINTMENT")
                    .title("Clinic Appointment")
                    .description("Status: " + appt.getStatus().name())
                    .status(appt.getStatus().name())
                    .eventDate(appt.getSlot().getStartTime())
                    .referenceId(appt.getId())
                    .build());
        }

        // 2. Home Visits
        List<HomeVisitRequest> homeVisits = homeVisitRequestRepository.findByPatientIdOrderByCreatedAtDesc(profile.getId());
        for (HomeVisitRequest visit : homeVisits) {
            String serviceType = visit.getReasonForVisit() != null ? visit.getReasonForVisit() : "General";
            events.add(TimelineEventDTO.builder()
                    .id("VISIT-" + visit.getId())
                    .type("HOME_VISIT")
                    .title(serviceType + " Home Visit")
                    .description("Status: " + visit.getStatus())
                    .status(visit.getStatus())
                    .eventDate(visit.getPreferredDate() != null
                            ? visit.getPreferredDate().atStartOfDay(ZoneId.systemDefault())
                            : visit.getCreatedAt())
                    .referenceId(visit.getId())
                    .build());
        }

        // 3. Patient Documents (acting as Prescriptions, etc.)
        List<PatientDocument> documents = patientDocumentRepository.findByPatientIdOrderByUploadedAtDesc(profile.getId());
        for (PatientDocument doc : documents) {
            events.add(TimelineEventDTO.builder()
                    .id("DOC-" + doc.getId())
                    .type(doc.getDocumentType().toUpperCase().replace(" ", "_")) // e.g. PRESCRIPTION
                    .title(doc.getTitle())
                    .description("Document uploaded")
                    .status("Completed")
                    .eventDate(doc.getUploadedAt())
                    .referenceId(doc.getId())
                    .build());
        }

        // 4. Lab Results
        List<LabTestRequest> labRequests = labTestRequestRepository.findByPatientIdOrderByRequestedAtDesc(profile.getId());
        for (LabTestRequest request : labRequests) {
            LabResult result = labResultRepository.findByRequestId(request.getId()).orElse(null);
            
            String status = request.getStatus();
            String description = "Lab Request: " + status;
            
            if (result != null) {
                if (Boolean.TRUE.equals(result.getIsCritical())) {
                    description = "Result: CRITICAL";
                } else if (Boolean.TRUE.equals(result.getIsAbnormal())) {
                    description = "Result: ABNORMAL";
                } else if (result.getVerifiedAt() != null) {
                    description = "Result: NORMAL (Verified)";
                } else {
                    description = "Result Entry Pending Verification";
                }
            }

            events.add(TimelineEventDTO.builder()
                    .id("LAB-" + request.getId())
                    .type("LAB_REPORT")
                    .title(request.getTestCatalog().getTestName())
                    .description(description)
                    .status(status)
                    .eventDate(request.getRequestedAt())
                    .referenceId(request.getId())
                    .build());
        }

        // Sort by date descending (newest first)
        events.sort(Comparator.comparing(TimelineEventDTO::getEventDate).reversed());
        return events;
    }
}
