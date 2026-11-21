package com.healthcare.clinic.hr.controller;

import com.healthcare.clinic.hr.entity.PayrollRun;
import com.healthcare.clinic.hr.entity.Payslip;
import com.healthcare.clinic.hr.entity.StaffPayroll;
import com.healthcare.clinic.hr.entity.Employee;
import com.healthcare.clinic.hr.repository.EmployeeRepository;
import com.healthcare.clinic.hr.repository.PayrollRunRepository;
import com.healthcare.clinic.hr.repository.PayslipRepository;
import com.healthcare.clinic.hr.repository.StaffPayrollRepository;
import com.healthcare.clinic.hr.service.PayrollService;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr/payroll")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
public class PayrollController {

    private final PayrollService payrollService;
    private final PayrollRunRepository payrollRunRepository;
    private final PayslipRepository payslipRepository;
    private final StaffPayrollRepository staffPayrollRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    @GetMapping
    public ResponseEntity<List<StaffPayroll>> getAllStaffPayrolls() {
        return ResponseEntity.ok(staffPayrollRepository.findAll());
    }

    @PostMapping("/generate")
    public ResponseEntity<StaffPayroll> generateStaffPayroll(@RequestBody Map<String, Object> payload) {
        Long staffId = Long.valueOf(payload.get("staffId").toString());
        String monthYear = (String) payload.get("monthYear");
        BigDecimal basicSalary = new BigDecimal(payload.get("basicSalary").toString());
        BigDecimal allowances = payload.get("allowances") != null ? new BigDecimal(payload.get("allowances").toString()) : BigDecimal.ZERO;
        BigDecimal deductions = payload.get("deductions") != null ? new BigDecimal(payload.get("deductions").toString()) : BigDecimal.ZERO;
        BigDecimal netSalary = basicSalary.add(allowances).subtract(deductions);

        User staff = userRepository.findById(staffId)
                .orElseGet(() -> employeeRepository.findById(staffId)
                        .map(Employee::getUser)
                        .orElseThrow(() -> new RuntimeException("Staff user not found with ID: " + staffId)));

        StaffPayroll staffPayroll = StaffPayroll.builder()
                .staff(staff)
                .monthYear(monthYear)
                .basicSalary(basicSalary)
                .allowances(allowances)
                .deductions(deductions)
                .netSalary(netSalary)
                .status("PENDING")
                .build();

        return ResponseEntity.ok(staffPayrollRepository.save(staffPayroll));
    }

    @PutMapping("/{payrollId}/process")
    public ResponseEntity<StaffPayroll> processStaffPayroll(@PathVariable Long payrollId) {
        StaffPayroll staffPayroll = staffPayrollRepository.findById(payrollId)
                .orElseThrow(() -> new RuntimeException("Payroll record not found"));
        staffPayroll.setStatus("PAID");
        return ResponseEntity.ok(staffPayrollRepository.save(staffPayroll));
    }

    @PutMapping("/process-batch")
    public ResponseEntity<Map<String, Object>> processBatchPayrolls(@RequestParam(required = false) String monthYear) {
        List<StaffPayroll> pending = staffPayrollRepository.findAll().stream()
                .filter(p -> "PENDING".equalsIgnoreCase(p.getStatus()))
                .filter(p -> monthYear == null || monthYear.equalsIgnoreCase(p.getMonthYear()))
                .toList();
        for (StaffPayroll p : pending) {
            p.setStatus("PAID");
            staffPayrollRepository.save(p);
        }
        return ResponseEntity.ok(Map.of("processedCount", pending.size(), "status", "SUCCESS"));
    }

    @GetMapping("/runs")
    public ResponseEntity<List<PayrollRun>> getAllPayrollRuns() {
        return ResponseEntity.ok(payrollRunRepository.findAll());
    }

    @PostMapping("/runs")
    public ResponseEntity<PayrollRun> createPayrollRun(@RequestBody PayrollRun run) {
        return ResponseEntity.ok(payrollService.createPayrollRun(run));
    }

    @PostMapping("/runs/{runId}/process")
    public ResponseEntity<Void> processPayrollRun(@PathVariable Long runId) {
        payrollService.processPayrollRun(runId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/runs/{runId}/payslips")
    public ResponseEntity<List<Payslip>> getPayslipsForRun(@PathVariable Long runId) {
        return ResponseEntity.ok(payslipRepository.findByPayrollRunId(runId));
    }

    @GetMapping("/payslips/employee/{employeeId}")
    public ResponseEntity<List<Payslip>> getEmployeePayslips(@PathVariable Long employeeId) {
        return ResponseEntity.ok(payslipRepository.findByEmployeeId(employeeId));
    }
}
