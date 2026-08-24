package com.healthcare.clinic.ai.service;

import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.department.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClinicContextRetriever {

    private final DepartmentRepository departmentRepository;
    private final AppointmentRepository appointmentRepository;

    public String buildSanitizedContext(Long userId, String userRole) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n[REAL-TIME CLINIC INFORMATION]\n");
        sb.append("- Clinic Name: Aurelian Healthcare Center\n");
        sb.append("- Operating Hours: Monday to Saturday, 08:00 AM - 08:00 PM. Emergency Services: 24/7.\n");
        sb.append("- Contact Support: +1 (800) 555-CLINIC / support@aurelianhealth.com\n");
        sb.append("- Location: 100 Healthcare Boulevard, Suite 400, Medical City\n");

        // Departments
        try {
            var departments = departmentRepository.findAll();
            if (!departments.isEmpty()) {
                sb.append("- Available Departments: ");
                List<String> names = departments.stream().map(d -> d.getName()).filter(n -> n != null).limit(10).toList();
                sb.append(String.join(", ", names)).append("\n");
            }
        } catch (Exception e) {
            log.debug("Could not query departments for AI context: {}", e.getMessage());
        }

        // Patient-specific Context if User is Authenticated
        if (userId != null && ("ROLE_PATIENT".equalsIgnoreCase(userRole) || "PATIENT".equalsIgnoreCase(userRole))) {
            sb.append("\n[AUTHENTICATED PATIENT CONTEXT]\n");
            sb.append("- Patient User ID: ").append(userId).append("\n");

            try {
                var appointments = appointmentRepository.findByPatientId(userId);
                if (appointments != null && !appointments.isEmpty()) {
                    sb.append("- Total Patient Appointments: ").append(appointments.size()).append("\n");
                    var upcoming = appointments.stream()
                            .limit(3)
                            .toList();
                    if (!upcoming.isEmpty()) {
                        sb.append("- Recent/Upcoming Appointments Summary:\n");
                        upcoming.forEach(a -> {
                            var timeStr = (a.getSlot() != null && a.getSlot().getStartTime() != null)
                                    ? a.getSlot().getStartTime().toString()
                                    : (a.getCreatedAt() != null ? a.getCreatedAt().toString() : "N/A");
                            sb.append("  * ID ").append(a.getId())
                              .append(" | Status: ").append(a.getStatus())
                              .append(" | Scheduled: ").append(timeStr).append("\n");
                        });
                    }
                } else {
                    sb.append("- No active appointments currently booked for this patient.\n");
                }
            } catch (Exception e) {
                log.debug("Could not query appointments for patient context: {}", e.getMessage());
            }
        }

        return sb.toString();
    }
}
