package com.healthcare.clinic.hr.service;

import com.healthcare.clinic.hr.entity.Attendance;
import com.healthcare.clinic.hr.entity.Employee;
import com.healthcare.clinic.hr.entity.LeaveRequest;
import com.healthcare.clinic.hr.repository.AttendanceRepository;
import com.healthcare.clinic.hr.repository.EmployeeRepository;
import com.healthcare.clinic.hr.repository.LeaveRequestRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HrService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @Transactional
    public Employee createEmployee(Employee employee) {
        if (employee.getUser() == null && employee.getUserId() != null) {
            userRepository.findById(employee.getUserId()).ifPresent(employee::setUser);
        }
        return employeeRepository.save(employee);
    }

    @Transactional
    public Attendance checkIn(Long employeeId) {
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElse(Attendance.builder()
                        .employee(employeeRepository.findById(employeeId).orElseThrow())
                        .date(today)
                        .status("PRESENT")
                        .build());
        if (attendance.getCheckIn() == null) {
            attendance.setCheckIn(ZonedDateTime.now());
        }
        return attendanceRepository.save(attendance);
    }

    @Transactional
    public Attendance checkOut(Long employeeId) {
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new RuntimeException("No check-in record found for today"));
        attendance.setCheckOut(ZonedDateTime.now());
        return attendanceRepository.save(attendance);
    }

    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceByDate(LocalDate date) {
        return attendanceRepository.findByDate(date);
    }

    @Transactional
    public LeaveRequest submitLeaveRequest(LeaveRequest leaveRequest) {
        if (leaveRequest.getEmployee() != null && leaveRequest.getEmployee().getId() != null) {
            employeeRepository.findById(leaveRequest.getEmployee().getId()).ifPresent(leaveRequest::setEmployee);
        }
        return leaveRequestRepository.save(leaveRequest);
    }

    @Transactional
    public LeaveRequest updateLeaveStatus(Long leaveRequestId, String status, Long reviewerUserId) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveRequestId).orElseThrow();
        leaveRequest.setStatus(status);
        leaveRequest.setReviewedBy(reviewerUserId);
        leaveRequest.setReviewedAt(ZonedDateTime.now());
        return leaveRequestRepository.save(leaveRequest);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRequestRepository.findAllByOrderByCreatedAtDesc();
    }
}
