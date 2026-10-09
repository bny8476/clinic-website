package com.healthcare.clinic.appointment;

import com.healthcare.clinic.appointment.dto.BookingRequest;
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
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.tenant.entity.Tenant;
import com.healthcare.clinic.tenant.repository.TenantRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
public class AppointmentBranchResolutionTest {

    @Autowired private AppointmentService appointmentService;
    @Autowired private AppointmentSlotRepository slotRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private DoctorProfileRepository doctorRepository;
    @Autowired private PatientProfileRepository patientProfileRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private TenantRepository tenantRepository;

    private Tenant tenant;
    private Branch activeBranch;
    private Branch inactiveBranch;
    private User patientUser;
    private User doctorUser;
    private DoctorProfile doctorProfile;
    private AppointmentSlot activeSlot;

    @BeforeEach
    void setUp() {
        tenant = tenantRepository.save(Tenant.builder()
                .name("Test Health Group " + System.currentTimeMillis())
                .status("ACTIVE")
                .build());

        activeBranch = branchRepository.save(Branch.builder()
                .tenant(tenant)
                .name("Main Downtown Clinic")
                .timezone("Asia/Kolkata")
                .address("456 Downtown Ave")
                .city("Chennai")
                .state("Tamil Nadu")
                .country("India")
                .postalCode("600002")
                .isActive(true)
                .build());

        inactiveBranch = branchRepository.save(Branch.builder()
                .tenant(tenant)
                .name("Closed Branch")
                .timezone("Asia/Kolkata")
                .address("789 Old Rd")
                .city("Chennai")
                .state("Tamil Nadu")
                .country("India")
                .postalCode("600003")
                .isActive(false)
                .build());

        patientUser = userRepository.save(User.builder()
                .email("patient_branch_test_" + System.currentTimeMillis() + "@test.com")
                .firstName("John")
                .lastName("Patient")
                .passwordHash("dummy")
                .build());

        doctorUser = userRepository.save(User.builder()
                .email("doctor_branch_test_" + System.currentTimeMillis() + "@test.com")
                .firstName("Jane")
                .lastName("Doctor")
                .passwordHash("dummy")
                .build());

        doctorProfile = doctorRepository.save(DoctorProfile.builder()
                .userId(doctorUser.getId())
                .specialty("General Practice")
                .qualifications("MBBS")
                .consultationFee(new BigDecimal("100.00"))
                .branchId(activeBranch.getId())
                .isActive(true)
                .build());

        ZonedDateTime testStart = ZonedDateTime.now().with(TemporalAdjusters.next(java.time.DayOfWeek.WEDNESDAY));
        activeSlot = slotRepository.save(AppointmentSlot.builder()
                .doctor(doctorProfile)
                .startTime(testStart)
                .endTime(testStart.plusMinutes(20))
                .isBooked(false)
                .branchId(activeBranch.getId())
                .build());

        // Authenticate as patient by default
        UserPrincipal principal = new UserPrincipal(patientUser.getId(), patientUser.getEmail(),
                List.of(new SimpleGrantedAuthority("ROLE_PATIENT")), null);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        appointmentRepository.deleteAll();
        slotRepository.deleteAll();
        doctorRepository.deleteAll();
        patientProfileRepository.deleteAll();
        try {
            userRepository.deleteAll();
        } catch (Exception ignored) {}
    }

    @Test
    void testBookingWithValidAuthorizedBranch_SucceedsAndPersistsBranchAndTenant() {
        BookingRequest request = BookingRequest.builder()
                .slotId(activeSlot.getId())
                .reasonForVisit("Checkup")
                .build();

        Appointment appointment = appointmentService.bookAppointmentFromRequest(request, "idemp-" + System.currentTimeMillis());

        assertThat(appointment).isNotNull();
        assertThat(appointment.getBranch()).isNotNull();
        assertThat(appointment.getBranch().getId()).isEqualTo(activeBranch.getId());
        assertThat(appointment.getBranchId()).isEqualTo(activeBranch.getId());
        assertThat(appointment.getTenant()).isNotNull();
        assertThat(appointment.getTenant().getId()).isEqualTo(tenant.getId());
        assertThat(appointment.getTenantId()).isEqualTo(tenant.getId());
        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.BOOKED);

        // Verify loaded from DB
        Appointment reloaded = appointmentRepository.findById(appointment.getId()).orElseThrow();
        assertThat(reloaded.getBranchId()).isEqualTo(activeBranch.getId());
        assertThat(reloaded.getTenantId()).isEqualTo(tenant.getId());
    }

    @Test
    void testBookingWithInactiveBranch_IsRejected() {
        User inactiveDocUser = userRepository.save(User.builder()
                .email("inactive_doc_" + System.currentTimeMillis() + "@test.com")
                .firstName("Inactive")
                .lastName("Doctor")
                .passwordHash("dummy")
                .build());

        DoctorProfile inactiveDoctor = doctorRepository.save(DoctorProfile.builder()
                .userId(inactiveDocUser.getId())
                .specialty("General Practice")
                .qualifications("MBBS")
                .consultationFee(new BigDecimal("100.00"))
                .branchId(inactiveBranch.getId())
                .isActive(true)
                .build());

        ZonedDateTime testStart = ZonedDateTime.now().with(TemporalAdjusters.next(java.time.DayOfWeek.THURSDAY));
        AppointmentSlot inactiveSlot = slotRepository.save(AppointmentSlot.builder()
                .doctor(inactiveDoctor)
                .startTime(testStart)
                .endTime(testStart.plusMinutes(20))
                .isBooked(false)
                .branchId(inactiveBranch.getId())
                .build());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            appointmentService.bookAppointment(patientUser.getId(), inactiveSlot.getId(), "Checkup", null, null);
        });

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("inactive");
    }

    @Test
    void testBookingWithMismatchedDoctorAndSlotBranch_IsRejected() {
        Branch branch2 = branchRepository.save(Branch.builder()
                .tenant(tenant)
                .name("Branch Two")
                .timezone("Asia/Kolkata")
                .address("777 Second Ave")
                .city("Chennai")
                .state("Tamil Nadu")
                .country("India")
                .postalCode("600004")
                .isActive(true)
                .build());

        ZonedDateTime testStart = ZonedDateTime.now().with(TemporalAdjusters.next(java.time.DayOfWeek.FRIDAY));
        AppointmentSlot mismatchSlot = slotRepository.save(AppointmentSlot.builder()
                .doctor(doctorProfile)
                .startTime(testStart)
                .endTime(testStart.plusMinutes(20))
                .isBooked(false)
                .branchId(branch2.getId()) // Slot has branch2, doctor has activeBranch
                .build());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            appointmentService.bookAppointment(patientUser.getId(), mismatchSlot.getId(), "Checkup", null, null);
        });

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("Incompatible clinic context");
    }

    @Test
    void testBookingWithRequestedBranchMismatch_IsRejected() {
        BookingRequest request = BookingRequest.builder()
                .slotId(activeSlot.getId())
                .branchId(99999L) // Does not match slot branch
                .reasonForVisit("Checkup")
                .build();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            appointmentService.bookAppointmentFromRequest(request, null);
        });

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("Requested branch ID");
    }

    @Test
    void testBookingOccupiedSlot_ReturnsConflict() {
        appointmentService.bookAppointment(patientUser.getId(), activeSlot.getId(), "First booking", null, "idemp-first");

        // Second patient tries to book the same slot
        User patientUser2 = userRepository.save(User.builder()
                .email("patient2_" + System.currentTimeMillis() + "@test.com")
                .firstName("Patient2")
                .lastName("Two")
                .passwordHash("dummy")
                .build());

        assertThrows(com.healthcare.clinic.appointment.exception.AppointmentConflictException.class, () -> {
            appointmentService.bookAppointment(patientUser2.getId(), activeSlot.getId(), "Second booking", null, "idemp-second");
        });
    }

    @Test
    void testStaffBookingForBranchRestrictedUser_EnforcesBranchAuthorization() {
        // Staff restricted to another branch tries to book for activeBranch
        Branch otherBranch = branchRepository.save(Branch.builder()
                .tenant(tenant)
                .name("Other Branch")
                .timezone("Asia/Kolkata")
                .address("999 Far St")
                .city("Coimbatore")
                .state("Tamil Nadu")
                .country("India")
                .postalCode("641001")
                .isActive(true)
                .build());

        UserPrincipal staffPrincipal = new UserPrincipal(999L, "staff@clinic.com",
                List.of(new SimpleGrantedAuthority("ROLE_RECEPTION")), otherBranch.getId());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(staffPrincipal, null, staffPrincipal.getAuthorities()));

        assertThrows(AccessDeniedException.class, () -> {
            appointmentService.bookAppointment(patientUser.getId(), activeSlot.getId(), "Staff booking", null, null);
        });
    }

    @Test
    void testRepeatedSubmissionWithIdempotencyKey_ReturnsSameAppointment() {
        String key = "unique-key-" + System.currentTimeMillis();
        Appointment appt1 = appointmentService.bookAppointment(patientUser.getId(), activeSlot.getId(), "Routine", null, key);
        Appointment appt2 = appointmentService.bookAppointment(patientUser.getId(), activeSlot.getId(), "Routine", null, key);

        assertThat(appt1.getId()).isEqualTo(appt2.getId());
        assertThat(appointmentRepository.count()).isEqualTo(1);
    }

    @Test
    void testRescheduleAppointment_PreservesBranchContext() {
        Appointment original = appointmentService.bookAppointment(patientUser.getId(), activeSlot.getId(), "Original", null, "resched-idemp");

        ZonedDateTime nextWednesday = activeSlot.getStartTime().plusWeeks(1);
        AppointmentSlot newSlot = slotRepository.save(AppointmentSlot.builder()
                .doctor(doctorProfile)
                .startTime(nextWednesday)
                .endTime(nextWednesday.plusMinutes(20))
                .isBooked(false)
                .branchId(activeBranch.getId())
                .build());

        Appointment rescheduled = appointmentService.rescheduleAppointment(original.getId(), newSlot.getId());

        assertThat(rescheduled).isNotNull();
        assertThat(rescheduled.getBranch()).isNotNull();
        assertThat(rescheduled.getBranch().getId()).isEqualTo(activeBranch.getId());
        assertThat(rescheduled.getBranchId()).isEqualTo(activeBranch.getId());
        assertThat(rescheduled.getRescheduledFrom()).isEqualTo(original.getId());

        Appointment oldReloaded = appointmentRepository.findById(original.getId()).orElseThrow();
        assertThat(oldReloaded.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
    }
}
