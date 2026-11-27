package com.healthcare.clinic.hr.service;

import com.healthcare.clinic.hr.controller.HrController;
import com.healthcare.clinic.hr.controller.PayrollController;
import com.healthcare.clinic.hr.entity.*;
import com.healthcare.clinic.hr.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@org.springframework.test.context.ActiveProfiles("test")
public class HrBatchIntegrationTest {

    @Autowired
    private PayrollService payrollService;

    @Autowired
    private PayrollRunRepository payrollRunRepository;

    @Autowired
    private PayslipRepository payslipRepository;

    @Autowired
    private SalaryStructureRepository salaryStructureRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private com.healthcare.clinic.identity.repository.UserRepository userRepository;

    @Autowired
    private PayrollController payrollController;

    @Autowired
    private HrController hrController;

    @Autowired
    private HrService hrService;

    @Autowired
    private StaffPayrollRepository staffPayrollRepository;

    @Autowired
    private com.healthcare.clinic.hr.controller.DocumentController hrDocumentController;

    @Autowired
    private StaffDocumentRepository staffDocumentRepository;

    @Test
    public void testPayrollRunEndToEnd() {
        com.healthcare.clinic.identity.entity.User hrUser = userRepository.findByEmail("hr.employee@test.com").orElseGet(() -> {
            com.healthcare.clinic.identity.entity.User u = new com.healthcare.clinic.identity.entity.User();
            u.setEmail("hr.employee@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("HR");
            u.setLastName("User");
            return userRepository.save(u);
        });

        Employee employee = new Employee();
        employee.setUserId(hrUser.getId());
        employee.setUser(hrUser);
        employee.setDepartment("Cardiology");
        employee.setDesignation("Senior Doctor");
        employee.setDateOfJoining(LocalDate.of(2020, 1, 1));
        employee = employeeRepository.save(employee);

        SalaryStructure structure = SalaryStructure.builder()
                .employee(employee)
                .basicSalary(new BigDecimal("5000.00"))
                .effectiveFrom(ZonedDateTime.now().minusDays(30))
                .status("ACTIVE")
                .build();
        salaryStructureRepository.save(structure);

        PayrollRun run = PayrollRun.builder()
                .name("May 2024 Payroll")
                .startDate(LocalDate.of(2024, 5, 1))
                .endDate(LocalDate.of(2024, 5, 31))
                .paymentDate(LocalDate.of(2024, 6, 1))
                .status("DRAFT")
                .build();
        run = payrollService.createPayrollRun(run);

        payrollService.processPayrollRun(run.getId());

        PayrollRun updatedRun = payrollRunRepository.findById(run.getId()).orElseThrow();
        assertThat(updatedRun.getStatus()).isEqualTo("REVIEW");

        long payslipCount = payslipRepository.findByPayrollRunId(run.getId()).size();
        assertThat(payslipCount).isGreaterThan(0);
    }

    @Test
    @org.springframework.security.test.context.support.WithMockUser(roles = "HR")
    public void testStaffPayrollGenerationAndProcessing() {
        com.healthcare.clinic.identity.entity.User staffUser = userRepository.findByEmail("staff.payroll@test.com").orElseGet(() -> {
            com.healthcare.clinic.identity.entity.User u = new com.healthcare.clinic.identity.entity.User();
            u.setEmail("staff.payroll@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("Staff");
            u.setLastName("Member");
            return userRepository.save(u);
        });

        Map<String, Object> payload = new HashMap<>();
        payload.put("staffId", staffUser.getId());
        payload.put("monthYear", "2026-11");
        payload.put("basicSalary", "65000.00");
        payload.put("allowances", "5000.00");
        payload.put("deductions", "2000.00");

        ResponseEntity<StaffPayroll> genRes = payrollController.generateStaffPayroll(payload);
        assertThat(genRes.getStatusCode().is2xxSuccessful()).isTrue();
        StaffPayroll created = genRes.getBody();
        assertThat(created).isNotNull();
        assertThat(created.getNetSalary()).isEqualByComparingTo("68000.00");
        assertThat(created.getStatus()).isEqualTo("PENDING");

        // Process payroll to PAID
        ResponseEntity<StaffPayroll> procRes = payrollController.processStaffPayroll(created.getId());
        assertThat(procRes.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(procRes.getBody().getStatus()).isEqualTo("PAID");

        // Verify getAllStaffPayrolls includes it
        ResponseEntity<List<Map<String, Object>>> allRes = payrollController.getAllStaffPayrolls();
        assertThat(allRes.getBody()).isNotEmpty();
    }

    @Test
    @org.springframework.security.test.context.support.WithMockUser(roles = "HR")
    public void testHrDashboardSummaryAndEmployeeUserMapping() {
        com.healthcare.clinic.identity.entity.User empUser = userRepository.findByEmail("doctor.hr@test.com").orElseGet(() -> {
            com.healthcare.clinic.identity.entity.User u = new com.healthcare.clinic.identity.entity.User();
            u.setEmail("doctor.hr@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("Dr. Alexander");
            u.setLastName("Fleming");
            return userRepository.save(u);
        });

        Employee emp = new Employee();
        emp.setUserId(empUser.getId());
        emp.setUser(empUser);
        emp.setDepartment("Microbiology");
        emp.setDesignation("Lead Researcher");
        emp.setDateOfJoining(LocalDate.now());
        emp = employeeRepository.save(emp);

        // Check in
        Attendance att = hrService.checkIn(emp.getId());
        assertThat(att.getStatus()).isEqualTo("PRESENT");
        assertThat(att.getCheckIn()).isNotNull();

        // Dashboard summary
        ResponseEntity<Map<String, Object>> dashRes = hrController.getHrDashboardSummary();
        assertThat(dashRes.getStatusCode().is2xxSuccessful()).isTrue();
        Map<String, Object> body = dashRes.getBody();
        assertThat(body).isNotNull();
        assertThat(((Number) body.get("totalEmployees")).longValue()).isGreaterThanOrEqualTo(1);
        assertThat(((Number) body.get("presentToday")).longValue()).isGreaterThanOrEqualTo(1);

        // Check out
        Attendance attOut = hrService.checkOut(emp.getId());
        assertThat(attOut.getCheckOut()).isNotNull();

        // Verify transient getters on Employee
        assertThat(emp.getName()).isEqualTo("Dr. Alexander Fleming");
        assertThat(emp.getEmail()).isEqualTo("doctor.hr@test.com");
    }

    @Test
    @org.springframework.security.test.context.support.WithMockUser(authorities = {"ROLE_HR"})
    public void testStaffDocumentAndBatchPayrollProcessing() throws Exception {
        com.healthcare.clinic.identity.entity.User staffUser = userRepository.findByEmail("doc.compliance@test.com").orElseGet(() -> {
            com.healthcare.clinic.identity.entity.User u = new com.healthcare.clinic.identity.entity.User();
            u.setEmail("doc.compliance@test.com");
            u.setPasswordHash("pass");
            u.setFirstName("Dr. Jane");
            u.setLastName("Foster");
            return userRepository.save(u);
        });

        // Test Batch Payroll
        Map<String, Object> payload = new HashMap<>();
        payload.put("staffId", staffUser.getId());
        payload.put("monthYear", "2026-12");
        payload.put("basicSalary", "80000.00");
        payload.put("allowances", "10000.00");
        payload.put("deductions", "4000.00");

        payrollController.generateStaffPayroll(payload);

        ResponseEntity<Map<String, Object>> batchRes = payrollController.processBatchPayrolls("2026-12");
        assertThat(batchRes.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(((Number) batchRes.getBody().get("processedCount")).intValue()).isGreaterThanOrEqualTo(1);

        // Test Document creation & retrieval
        StaffDocument doc = StaffDocument.builder()
                .staff(staffUser)
                .documentType("CONTRACT")
                .filename("Contract_2026.pdf")
                .filePath("uploads/documents/test_contract.pdf")
                .uploadedBy(staffUser.getId())
                .build();
        staffDocumentRepository.save(doc);

        ResponseEntity<List<StaffDocument>> allDocs = hrDocumentController.getAllDocuments(staffUser.getId());
        assertThat(allDocs.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(allDocs.getBody()).isNotEmpty();
        assertThat(allDocs.getBody().get(0).getStaffName()).isEqualTo("Dr. Jane Foster");
    }
}
