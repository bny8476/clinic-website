package com.healthcare.clinic;

import com.healthcare.clinic.doctor.service.DoctorScheduleService;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.time.LocalDate;
import java.util.List;

@SpringBootTest
class GenerateSlotsTest {

    @Autowired
    private DoctorScheduleService scheduleService;

    @Autowired
    private DoctorProfileRepository doctorRepository;

    @Test
    void generateSlots() {
        LocalDate start = LocalDate.of(2026, 8, 1);
        LocalDate end = LocalDate.of(2026, 8, 31);
        
        List<DoctorProfile> doctors = doctorRepository.findAll();
        int totalSlots = 0;
        for (DoctorProfile doc : doctors) {
            try {
                totalSlots += scheduleService.generateSlotsForRange(doc.getUserId(), start, end);
            } catch (Exception e) {
                System.out.println("Failed for doctor userId " + doc.getUserId() + ": " + e.getMessage());
            }
        }
        System.out.println("GENERATED_SLOTS_COUNT: " + totalSlots);
    }
}
