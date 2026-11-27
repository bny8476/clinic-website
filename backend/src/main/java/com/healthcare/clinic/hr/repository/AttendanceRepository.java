package com.healthcare.clinic.hr.repository;

import com.healthcare.clinic.hr.entity.Attendance;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    @EntityGraph(attributePaths = {"employee", "employee.user", "shift"})
    List<Attendance> findByDate(LocalDate date);

    @EntityGraph(attributePaths = {"employee", "employee.user", "shift"})
    List<Attendance> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);

    @EntityGraph(attributePaths = {"employee", "employee.user", "shift"})
    List<Attendance> findByEmployeeIdOrderByDateDesc(Long employeeId);

    @EntityGraph(attributePaths = {"employee", "employee.user", "shift"})
    Optional<Attendance> findByEmployeeIdAndDate(Long employeeId, LocalDate date);
}
