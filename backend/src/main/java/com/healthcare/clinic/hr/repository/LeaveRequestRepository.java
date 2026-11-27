package com.healthcare.clinic.hr.repository;

import com.healthcare.clinic.hr.entity.LeaveRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    @EntityGraph(attributePaths = {"employee", "employee.user"})
    List<LeaveRequest> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    @EntityGraph(attributePaths = {"employee", "employee.user"})
    List<LeaveRequest> findByStatus(String status);

    @EntityGraph(attributePaths = {"employee", "employee.user"})
    List<LeaveRequest> findAllByOrderByCreatedAtDesc();
}
