package com.healthcare.clinic.appointment.repository;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.dto.AppointmentResponseDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"doctor"})
    List<Appointment> findByPatientId(Long patientId);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"patient"})
    List<Appointment> findByDoctorId(Long doctorId);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"doctor"})
    List<Appointment> findByPatient_UserId(Long userId);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"patient"})
    List<Appointment> findByDoctor_UserId(Long userId);
    List<Appointment> findAllByStatus(com.healthcare.clinic.appointment.entity.AppointmentStatus status);
    java.util.Optional<Appointment> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT new com.healthcare.clinic.appointment.dto.AppointmentResponseDto(" +
           "a.id, a.status, a.reasonForVisit, a.notes, a.branchId, a.createdAt, " +
           "a.slot.id, a.slot.startTime, a.slot.endTime, " +
           "a.doctor.userId, du.firstName, du.lastName, " +
           "a.patient.userId, pu.firstName, pu.lastName) " +
           "FROM Appointment a " +
           "JOIN com.healthcare.clinic.identity.entity.User du ON a.doctor.userId = du.id " +
           "JOIN com.healthcare.clinic.identity.entity.User pu ON a.patient.userId = pu.id " +
           "WHERE a.patient.userId = :userId " +
           "ORDER BY a.slot.startTime DESC")
    List<AppointmentResponseDto> findAppointmentsForPatientWithNames(@Param("userId") Long userId);

    @Query("SELECT new com.healthcare.clinic.appointment.dto.AppointmentResponseDto(" +
           "a.id, a.status, a.reasonForVisit, a.notes, a.branchId, a.createdAt, " +
           "a.slot.id, a.slot.startTime, a.slot.endTime, " +
           "a.doctor.userId, du.firstName, du.lastName, " +
           "a.patient.userId, pu.firstName, pu.lastName) " +
           "FROM Appointment a " +
           "JOIN com.healthcare.clinic.identity.entity.User du ON a.doctor.userId = du.id " +
           "JOIN com.healthcare.clinic.identity.entity.User pu ON a.patient.userId = pu.id " +
           "WHERE a.doctor.userId = :userId " +
           "ORDER BY a.slot.startTime DESC")
    List<AppointmentResponseDto> findAppointmentsForDoctorWithNames(@Param("userId") Long userId);

    @Query("SELECT new com.healthcare.clinic.appointment.dto.AppointmentResponseDto(" +
           "a.id, a.status, a.reasonForVisit, a.notes, a.branchId, a.createdAt, " +
           "a.slot.id, a.slot.startTime, a.slot.endTime, " +
           "a.doctor.userId, du.firstName, du.lastName, " +
           "a.patient.userId, pu.firstName, pu.lastName) " +
           "FROM Appointment a " +
           "JOIN com.healthcare.clinic.identity.entity.User du ON a.doctor.userId = du.id " +
           "JOIN com.healthcare.clinic.identity.entity.User pu ON a.patient.userId = pu.id " +
           "WHERE a.doctor.userId = :userId " +
           "AND a.slot.startTime >= :startOfDay AND a.slot.startTime <= :endOfDay " +
           "ORDER BY a.slot.startTime ASC")
    List<AppointmentResponseDto> findAppointmentsForDoctorToday(
           @Param("userId") Long userId,
           @Param("startOfDay") ZonedDateTime startOfDay,
           @Param("endOfDay") ZonedDateTime endOfDay);

    @Query("SELECT new com.healthcare.clinic.appointment.dto.AppointmentResponseDto(" +
           "a.id, a.status, a.reasonForVisit, a.notes, a.branchId, a.createdAt, " +
           "a.slot.id, a.slot.startTime, a.slot.endTime, " +
           "a.doctor.userId, du.firstName, du.lastName, " +
           "a.patient.userId, pu.firstName, pu.lastName) " +
           "FROM Appointment a " +
           "JOIN com.healthcare.clinic.identity.entity.User du ON a.doctor.userId = du.id " +
           "JOIN com.healthcare.clinic.identity.entity.User pu ON a.patient.userId = pu.id " +
           "WHERE a.slot.startTime >= :startOfDay AND a.slot.startTime <= :endOfDay " +
           "ORDER BY a.slot.startTime ASC")
    List<AppointmentResponseDto> findAllAppointmentsToday(
           @Param("startOfDay") ZonedDateTime startOfDay,
           @Param("endOfDay") ZonedDateTime endOfDay);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.patient.userId = :patientUserId AND a.doctor.id = :doctorId AND a.status != 'CANCELLED' AND a.slot.startTime >= :startOfDay AND a.slot.startTime < :endOfDay")
    long countByPatientAndDoctorAndDate(@Param("patientUserId") Long patientUserId, @Param("doctorId") Long doctorId, @Param("startOfDay") ZonedDateTime startOfDay, @Param("endOfDay") ZonedDateTime endOfDay);
    
    long countBySlotStartTimeBetween(java.time.ZonedDateTime start, java.time.ZonedDateTime end);
    long countByStatus(com.healthcare.clinic.appointment.entity.AppointmentStatus status);
}
