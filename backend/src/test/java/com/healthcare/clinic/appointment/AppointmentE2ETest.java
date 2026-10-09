package com.healthcare.clinic.appointment;

import com.healthcare.clinic.appointment.entity.AppointmentSlot;
import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.appointment.repository.AppointmentSlotRepository;
import com.healthcare.clinic.appointment.service.AppointmentService;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.patient.repository.VitalsRepository;
import com.healthcare.clinic.patient.entity.Vitals;
import com.healthcare.clinic.reception.entity.QueueToken;
import com.healthcare.clinic.reception.service.QueueTokenService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;


import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
public class AppointmentE2ETest {

    @Autowired private AppointmentService appointmentService;
    @Autowired private AppointmentSlotRepository slotRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private DoctorProfileRepository doctorRepository;
    @Autowired private PatientProfileRepository patientProfileRepository;
    @Autowired private VitalsRepository vitalsRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private QueueTokenService queueTokenService;
    @Autowired private com.healthcare.clinic.reception.repository.QueueTokenRepository queueTokenRepository;

    private User patientUser;
    private User doctorUser;
    private DoctorProfile doctorProfile;
    private AppointmentSlot testSlot;
    private Branch branch;

    @BeforeEach
    void setUp() {
        branch = branchRepository.save(Branch.builder()
                .name("Main Branch")
                .timezone("Asia/Kolkata")
                .address("123 Test St")
                .city("Chennai")
                .state("Tamil Nadu")
                .country("India")
                .postalCode("600001")
                .build());

        patientUser = userRepository.save(User.builder()
                .email("e2e_patient@test.com")
                .firstName("E2E")
                .lastName("Patient")
                .passwordHash("dummy")
                .build());

        doctorUser = userRepository.save(User.builder()
                .email("e2e_doctor@test.com")
                .firstName("E2E")
                .lastName("Doctor")
                .passwordHash("dummy")
                .build());

        doctorProfile = doctorRepository.save(DoctorProfile.builder()
                .userId(doctorUser.getId())
                .specialty("Test E2E")
                .qualifications("MD")
                .consultationFee(new java.math.BigDecimal("150.00"))
                .branchId(branch.getId())
                .build());

        // Select a future wednesday to avoid weekend rules
        ZonedDateTime testStart = ZonedDateTime.now().with(TemporalAdjusters.next(java.time.DayOfWeek.WEDNESDAY));
        
        testSlot = slotRepository.save(AppointmentSlot.builder()
                .doctor(doctorProfile)
                .startTime(testStart)
                .endTime(testStart.plusMinutes(20))
                .isBooked(false)
                .branchId(branch.getId())
                .build());
    }

    @AfterEach
    void tearDown() {
        queueTokenRepository.deleteAll();
        vitalsRepository.deleteAll();
        appointmentRepository.deleteAll();
        slotRepository.deleteAll();
        doctorRepository.deleteAll();
        patientProfileRepository.deleteAll();
        try {
            userRepository.deleteAll();
        } catch (Exception ignored) {}
    }

    @Test
    void testEndToEndWorkflow() {
        // 1. Patient Books Appointment (Patient Registration is auto-handled)
        Appointment appointment = appointmentService.bookAppointment(patientUser.getId(), testSlot.getId(), "General Checkup", null, null);
        assertThat(appointment).isNotNull();
        assertThat(appointment.getPatient()).isNotNull();
        assertThat(appointment.getPatient().getUserId()).isEqualTo(patientUser.getId());
        
        // Ensure double booking same day is prevented
        AppointmentSlot nextSlot = slotRepository.save(AppointmentSlot.builder()
                .doctor(doctorProfile)
                .startTime(testSlot.getStartTime().plusMinutes(20))
                .endTime(testSlot.getStartTime().plusMinutes(40))
                .isBooked(false)
                .branchId(branch.getId())
                .build());
                
        assertThrows(com.healthcare.clinic.appointment.exception.AppointmentConflictException.class, () -> {
            appointmentService.bookAppointment(patientUser.getId(), nextSlot.getId(), "Second checkup", null, null);
        });

        // 2. Reception Generates Queue Token for Walk-in
        QueueToken token = queueTokenService.generateToken(branch, null, appointment.getId());
        assertThat(token).isNotNull();
        assertThat(token.getAppointment()).isNotNull();
        assertThat(token.getAppointment().getId()).isEqualTo(appointment.getId());
        assertThat(token.getTokenNumber()).isGreaterThan(0);

        // 3. Nurse records Vitals
        Vitals vitals = Vitals.builder()
                .patient(appointment.getPatient())
                .doctorId(1L) // Nurse ID
                .heightCm(175)
                .weightKg(70)
                .bloodPressure("120/80")
                .pulseBpm(72)
                .build();
                
        Vitals savedVitals = vitalsRepository.save(vitals);
        assertThat(savedVitals.getId()).isNotNull();

        // 4. Validate everything is linked correctly for the consultation
        PatientProfile profile = patientProfileRepository.findByUserId(patientUser.getId()).orElseThrow();
        assertThat(profile.getId()).isEqualTo(appointment.getPatient().getId());
        
        long count = vitalsRepository.count();
        assertThat(count).isEqualTo(1);
    }
}
