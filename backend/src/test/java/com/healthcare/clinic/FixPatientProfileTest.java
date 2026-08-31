package com.healthcare.clinic;

import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class FixPatientProfileTest {

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Test
    void fixProfiles() {
        Long userId = 15L;
        PatientProfile profile = patientProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            profile = PatientProfile.builder()
                    .userId(userId)
                    .gender("Other")
                    .branchId(1L)
                    .emergencyContactName("Self")
                    .emergencyContactPhone("+1000000000")
                    .build();
            patientProfileRepository.save(profile);
            System.out.println("CREATED PatientProfile for user 15");
        } else {
            System.out.println("PatientProfile already exists for user 15");
        }
    }
}
