package com.healthcare.clinic.appointment;


import com.healthcare.clinic.appointment.entity.AppointmentSlot;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.appointment.repository.AppointmentSlotRepository;
import com.healthcare.clinic.appointment.service.AppointmentService;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.ActiveProfiles;

import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class AppointmentConcurrencyTest {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentSlotRepository slotRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorProfileRepository doctorRepository;

    private User patient1;
    private User patient2;
    private AppointmentSlot testSlot;

    @BeforeEach
    void setUp() {
        // Assume seed data exists or create necessary entities
        // Creating minimal patient users
        patient1 = userRepository.save(User.builder()
                .email("patient1@test.com")
                .firstName("Patient")
                .lastName("One")
                .passwordHash("dummy")
                .build());

        patient2 = userRepository.save(User.builder()
                .email("patient2@test.com")
                .firstName("Patient")
                .lastName("Two")
                .passwordHash("dummy")
                .build());

        User doctorUser = userRepository.save(User.builder()
                .email("doc_test@test.com")
                .firstName("Doc")
                .lastName("Test")
                .passwordHash("dummy")
                .build());

        DoctorProfile doctor = doctorRepository.save(DoctorProfile.builder()
                .userId(doctorUser.getId())
                .specialty("Test")
                .qualifications("MD")
                .consultationFee(new java.math.BigDecimal("100.00"))
                .branchId(1L)
                .build());

        ZonedDateTime testStart = ZonedDateTime.now().with(TemporalAdjusters.next(java.time.DayOfWeek.WEDNESDAY));
        testSlot = slotRepository.save(AppointmentSlot.builder()
                .doctor(doctor)
                .startTime(testStart)
                .endTime(testStart.plusMinutes(20))
                .isBooked(false)
                .branchId(1L)
                .build());
    }

    @AfterEach
    void tearDown() {
        appointmentRepository.deleteAll();
        slotRepository.deleteAll();
        doctorRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testConcurrentBooking() throws InterruptedException {
        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(1); // To synchronize start
        CountDownLatch doneLatch = new CountDownLatch(threads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger optimisticLockCount = new AtomicInteger(0);

        Runnable bookTask1 = () -> {
            try {
                latch.await();
                appointmentService.bookAppointment(patient1.getId(), testSlot.getId(), "Reason 1", null, null);
                successCount.incrementAndGet();
            } catch (org.springframework.web.server.ResponseStatusException e) {
                if (e.getStatusCode() == org.springframework.http.HttpStatus.CONFLICT || (e.getReason() != null && e.getReason().contains("booked"))) {
                    optimisticLockCount.incrementAndGet();
                } else {
                    e.printStackTrace();
                }
            } catch (org.springframework.dao.DataIntegrityViolationException | ObjectOptimisticLockingFailureException e) {
                optimisticLockCount.incrementAndGet();
            } catch (Exception e) {
                if (e.getMessage() != null && (e.getMessage().contains("booked") || e.getMessage().contains("CONFLICT"))) {
                    optimisticLockCount.incrementAndGet();
                } else {
                    e.printStackTrace();
                }
            } finally {
                doneLatch.countDown();
            }
        };

        Runnable bookTask2 = () -> {
            try {
                latch.await();
                appointmentService.bookAppointment(patient2.getId(), testSlot.getId(), "Reason 2", null, null);
                successCount.incrementAndGet();
            } catch (org.springframework.web.server.ResponseStatusException e) {
                if (e.getStatusCode() == org.springframework.http.HttpStatus.CONFLICT || (e.getReason() != null && e.getReason().contains("booked"))) {
                    optimisticLockCount.incrementAndGet();
                } else {
                    e.printStackTrace();
                }
            } catch (org.springframework.dao.DataIntegrityViolationException | ObjectOptimisticLockingFailureException e) {
                optimisticLockCount.incrementAndGet();
            } catch (Exception e) {
                if (e.getMessage() != null && (e.getMessage().contains("booked") || e.getMessage().contains("CONFLICT"))) {
                    optimisticLockCount.incrementAndGet();
                } else {
                    e.printStackTrace();
                }
            } finally {
                doneLatch.countDown();
            }
        };

        executor.submit(bookTask1);
        executor.submit(bookTask2);

        latch.countDown(); // Start both threads
        doneLatch.await(); // Wait for both to finish

        assertThat(successCount.get()).isEqualTo(1);
        assertThat(optimisticLockCount.get()).isEqualTo(1);
        assertThat(appointmentRepository.count()).isEqualTo(1);

        AppointmentSlot updatedSlot = slotRepository.findById(testSlot.getId()).orElseThrow();
        assertThat(updatedSlot.getIsBooked()).isTrue();
    }
}
