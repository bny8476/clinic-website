package com.healthcare.clinic.doctor.repository;

import com.healthcare.clinic.doctor.entity.DoctorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long> {
    Optional<DoctorProfile> findByUserId(Long userId);
    List<DoctorProfile> findByIsActiveTrue();
    long countByIsActiveTrue();
    boolean existsByRegistrationNumber(String registrationNumber);
    Optional<DoctorProfile> findByRegistrationNumber(String registrationNumber);

    @Query("SELECT new com.healthcare.clinic.doctor.dto.DoctorProfileWithNameDto(dp, u.firstName, u.lastName) FROM DoctorProfile dp JOIN User u ON dp.userId = u.id WHERE dp.isActive = true")
    List<com.healthcare.clinic.doctor.dto.DoctorProfileWithNameDto> findActiveDoctorsWithNames();
}
