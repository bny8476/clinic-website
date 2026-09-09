package com.healthcare.clinic.appointment.repository;

import com.healthcare.clinic.appointment.entity.AppointmentSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;

@Repository
public interface AppointmentSlotRepository extends JpaRepository<AppointmentSlot, Long> {
    List<AppointmentSlot> findByDoctorUserIdAndStartTimeBetweenAndIsBookedFalse(Long userId, ZonedDateTime start, ZonedDateTime end);
    List<AppointmentSlot> findByDoctorUserIdAndStartTimeBetween(Long userId, ZonedDateTime start, ZonedDateTime end);
    List<AppointmentSlot> findByDoctorIdAndStartTimeBetween(Long doctorId, ZonedDateTime start, ZonedDateTime end);
    List<AppointmentSlot> findByDoctorIdAndStartTimeBetweenAndIsBookedFalse(Long doctorId, ZonedDateTime start, ZonedDateTime end);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByDoctorUserIdAndStartTimeBetweenAndIsBookedFalse(Long userId, ZonedDateTime start, ZonedDateTime end);
    
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT s FROM AppointmentSlot s WHERE s.id = :id")
    java.util.Optional<AppointmentSlot> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);
}
