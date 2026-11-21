package com.healthcare.clinic.reception.service;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.entity.AppointmentSlot;
import com.healthcare.clinic.appointment.entity.AppointmentStatus;
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
import com.healthcare.clinic.reception.entity.QueueToken;
import com.healthcare.clinic.reception.entity.WalkInRegistration;
import com.healthcare.clinic.reception.repository.NoShowRepository;
import com.healthcare.clinic.reception.repository.QueueTokenRepository;
import com.healthcare.clinic.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ReceptionBatch2IntegrationTest {

    @Autowired
    private WalkInRegistrationService walkInService;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private QueueTokenRepository queueTokenRepository;

    @Autowired
    private NoShowRepository noShowRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private AppointmentSlotRepository slotRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    private User testReceptionist;
    private PatientProfile testPatient;
    private DoctorProfile testDoctor;
    private Branch branch;

    @BeforeEach
    void setUp() {
        branch = new Branch();
        branch.setName("Test Branch");
        branch.setAddress("123 Test St");
        branch.setCity("Test City");
        branch.setState("Test State");
        branch.setCountry("Test Country");
        branch.setPostalCode("12345");
        branch.setPhoneNumber("+1234567890");
        branch.setEmail("test@branch.com");
        branch.setTimezone("UTC");
        branch = branchRepository.save(branch);

        String suffix = "_" + System.nanoTime();
        testReceptionist = new User();
        testReceptionist.setEmail("reception2" + suffix + "@test.com");
        testReceptionist.setFirstName("Rec");
        testReceptionist.setLastName("Two");
        testReceptionist.setPasswordHash("hash");
        testReceptionist.setBranchId(branch.getId());
        testReceptionist = userRepository.save(testReceptionist);

        User patientUser = new User();
        patientUser.setEmail("patient2" + suffix + "@test.com");
        patientUser.setFirstName("John");
        patientUser.setLastName("Doe");
        patientUser.setPhoneNumber("+111222333");
        patientUser.setPasswordHash("hash");
        patientUser.setBranchId(branch.getId());
        patientUser = userRepository.save(patientUser);

        testPatient = new PatientProfile();
        testPatient.setUserId(patientUser.getId());
        testPatient.setBranchId(branch.getId());
        testPatient = patientProfileRepository.save(testPatient);

        User doctorUser = new User();
        doctorUser.setEmail("doctor2" + suffix + "@test.com");
        doctorUser.setFirstName("Doc");
        doctorUser.setLastName("Tor");
        doctorUser.setPasswordHash("hash");
        doctorUser.setBranchId(branch.getId());
        doctorUser = userRepository.save(doctorUser);

        testDoctor = new DoctorProfile();
        testDoctor.setUserId(doctorUser.getId());
        testDoctor.setSpecialty("General");
        testDoctor.setQualifications("MBBS");
        testDoctor.setConsultationFee(java.math.BigDecimal.valueOf(500.0));
        testDoctor.setBranchId(branch.getId());
        testDoctor = doctorProfileRepository.save(testDoctor);

        UserPrincipal principal = new UserPrincipal(
                testReceptionist.getId(),
                testReceptionist.getEmail(),
                List.of(new SimpleGrantedAuthority("ROLE_RECEPTION")),
                testReceptionist.getBranchId()
        );

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "password", principal.getAuthorities())
        );
    }

    @Test
    void testWalkInRegistrationAndQueueToken() {
        WalkInRegistration walkIn = walkInService.registerWalkIn(branch.getId(), testPatient.getId(), "Fever", 1, "PEDIATRICS");
        
        assertThat(walkIn).isNotNull();
        assertThat(walkIn.getStatus()).isEqualTo("WAITING");

        List<QueueToken> tokens = queueTokenRepository.findByBranchIdAndGeneratedAtAfterOrderByPriorityLevelDescTokenNumberAsc(
                branch.getId(), ZonedDateTime.now().minusDays(1)
        );

        assertThat(tokens).hasSize(1);
        QueueToken token = tokens.get(0);
        assertThat(token.getPriorityLevel()).isEqualTo(1);
        assertThat(token.getCurrentDepartment()).isEqualTo("PEDIATRICS");
        assertThat(token.getWalkIn().getId()).isEqualTo(walkIn.getId());
    }

    @Test
    void testAppointmentNoShow() {
        AppointmentSlot slot = AppointmentSlot.builder()
                .doctor(testDoctor)
                .startTime(ZonedDateTime.now().plusHours(1))
                .endTime(ZonedDateTime.now().plusHours(1).plusMinutes(30))
                .branchId(branch.getId())
                .isBooked(true)
                .build();
        slot = slotRepository.save(slot);

        Appointment appointment = Appointment.builder()
                .patient(testPatient)
                .doctor(testDoctor)
                .slot(slot)
                .status(AppointmentStatus.BOOKED)
                .reasonForVisit("Checkup")
                .branchId(branch.getId())
                .build();
        appointment = appointmentRepository.save(appointment);

        // Mark as NO_SHOW
        appointmentService.updateAppointmentStatus(appointment.getId(), AppointmentStatus.NO_SHOW);

        // Verify slot released
        AppointmentSlot updatedSlot = slotRepository.findById(slot.getId()).orElseThrow();
        assertThat(updatedSlot.getIsBooked()).isFalse();

        // Verify NoShow recorded
        var noShows = noShowRepository.findByAppointmentId(appointment.getId());
        assertThat(noShows).hasSize(1);
        assertThat(noShows.get(0).getReason()).isEqualTo("Missed Appointment");
    }
}
