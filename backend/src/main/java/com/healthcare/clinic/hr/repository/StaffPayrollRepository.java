package com.healthcare.clinic.hr.repository;

import com.healthcare.clinic.hr.entity.StaffPayroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffPayrollRepository extends JpaRepository<StaffPayroll, Long> {
    List<StaffPayroll> findByStaffIdOrderByMonthYearDesc(Long staffId);
    List<StaffPayroll> findByMonthYear(String monthYear);
    Optional<StaffPayroll> findByStaffIdAndMonthYear(Long staffId, String monthYear);
    List<StaffPayroll> findAllByOrderByIdDesc();
}
