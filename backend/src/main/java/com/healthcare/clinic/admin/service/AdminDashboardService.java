package com.healthcare.clinic.admin.service;

import com.healthcare.clinic.admin.dto.AdminDashboardMetricsDto;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.laboratory.repository.LabTestRequestRepository;
import com.healthcare.clinic.pharmacy.repository.PrescriptionRepository;
import com.healthcare.clinic.reception.repository.ClinicPaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.healthcare.clinic.reception.entity.ClinicPayment;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final LabTestRequestRepository labTestRequestRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final ClinicPaymentRepository clinicPaymentRepository;

    @Transactional(readOnly = true)
    public AdminDashboardMetricsDto getDashboardMetrics() {
        ZonedDateTime startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault());
        ZonedDateTime endOfDay = LocalDate.now().plusDays(1).atStartOfDay(ZoneId.systemDefault());

        long totalPatients = patientProfileRepository.count();
        long totalDoctors = doctorProfileRepository.countByIsActiveTrue();
        // Assuming total users minus patients/doctors gives staff roughly, or we can count specific roles
        long activeUsers = userRepository.countByEnabledTrue();
        long inactiveUsers = userRepository.countByEnabledFalse();
        
        long todaysAppointments = appointmentRepository.countBySlotStartTimeBetween(startOfDay, endOfDay);
        long pendingAppointments = appointmentRepository.countByStatus(com.healthcare.clinic.appointment.entity.AppointmentStatus.BOOKED);
        long completedConsultations = appointmentRepository.countByStatus(com.healthcare.clinic.appointment.entity.AppointmentStatus.COMPLETED);

        long totalStaff = userRepository.countByRolesName("ROLE_NURSE") + 
                          userRepository.countByRolesName("ROLE_RECEPTIONIST") + 
                          userRepository.countByRolesName("ROLE_PHARMACIST") + 
                          userRepository.countByRolesName("ROLE_LAB_TECHNICIAN") + 
                          userRepository.countByRolesName("ROLE_ADMIN");

        long pendingLabRequests = labTestRequestRepository.countAllByStatus("PENDING");
        long pendingPharmacyPrescriptions = prescriptionRepository.countByStatus("PENDING");
        
        // Use 0 for these since inventory wasn't requested in scope
        long lowStockMedicines = 0L;
        long expiringMedicines = 0L;

        // Todays revenue from Clinic payments
        List<ClinicPayment> todaysPayments = clinicPaymentRepository.findByCreatedAtBetween(
                startOfDay.toLocalDateTime(), endOfDay.toLocalDateTime());
        BigDecimal todaysRevenue = todaysPayments.stream()
                .map(ClinicPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminDashboardMetricsDto.builder()
                .totalPatients(totalPatients)
                .totalDoctors(totalDoctors)
                .totalStaff(totalStaff)
                .activeUsers(activeUsers)
                .inactiveUsers(inactiveUsers)
                .todaysAppointments(todaysAppointments)
                .pendingAppointments(pendingAppointments)
                .completedConsultations(completedConsultations)
                .pendingLabRequests(pendingLabRequests)
                .pendingPharmacyPrescriptions(pendingPharmacyPrescriptions)
                .lowStockMedicines(lowStockMedicines)
                .expiringMedicines(expiringMedicines)
                .todaysRevenue(todaysRevenue)
                .outstandingPayments(BigDecimal.ZERO)
                .build();
    }
}
