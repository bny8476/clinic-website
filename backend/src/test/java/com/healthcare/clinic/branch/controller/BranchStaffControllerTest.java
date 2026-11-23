package com.healthcare.clinic.branch.controller;

import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.hr.repository.EmployeeRepository;
import com.healthcare.clinic.hr.repository.LeaveRequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BranchStaffControllerTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private BranchRepository branchRepository;

    @InjectMocks
    private BranchStaffController controller;

    @Test
    public void getBranchStaff_ShouldReturnStaffRoster() {
        when(employeeRepository.findAll()).thenReturn(Collections.emptyList());

        ResponseEntity<List<Map<String, Object>>> response = controller.getBranchStaff(null, null);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        List<Map<String, Object>> staff = response.getBody();
        assertNotNull(staff);
        assertFalse(staff.isEmpty());
        assertTrue(staff.stream().anyMatch(s -> s.get("name").equals("Dr. Sarah Jenkins")));
    }

    @Test
    public void getLeaveRequests_ShouldReturnRequests() {
        when(leaveRequestRepository.findAllByOrderByCreatedAtDesc()).thenReturn(Collections.emptyList());

        ResponseEntity<List<Map<String, Object>>> response = controller.getLeaveRequests(null);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        List<Map<String, Object>> leaves = response.getBody();
        assertNotNull(leaves);
        assertFalse(leaves.isEmpty());
        assertTrue(leaves.stream().anyMatch(l -> l.get("staffName").equals("Dr. Vikram Rao")));
    }

    @Test
    public void submitLeaveRequest_ShouldCreateRequest() {
        Map<String, Object> req = new HashMap<>();
        req.put("staffName", "Dr. Sarah Jenkins");
        req.put("leaveType", "Casual Leave");
        req.put("fromDate", "2026-12-01");
        req.put("toDate", "2026-12-02");
        req.put("reason", "Personal appointment");

        ResponseEntity<Map<String, Object>> response = controller.submitLeaveRequest(req);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        Map<String, Object> created = response.getBody();
        assertNotNull(created);
        assertEquals("Dr. Sarah Jenkins", created.get("staffName"));
        assertEquals("PENDING", created.get("status"));
    }

    @Test
    public void updateLeaveStatus_ShouldApprove() {
        Map<String, String> statusMap = new HashMap<>();
        statusMap.put("status", "APPROVED");

        ResponseEntity<Map<String, Object>> response = controller.updateLeaveStatus(201L, statusMap);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("APPROVED", body.get("status"));
    }

    @Test
    public void assignShift_ShouldUpdateShift() {
        Map<String, String> shiftData = new HashMap<>();
        shiftData.put("staffName", "Dr. Sarah Jenkins");
        shiftData.put("shiftHours", "03:00 PM – 11:00 PM (Evening)");

        ResponseEntity<Map<String, Object>> response = controller.assignShift(shiftData);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("Dr. Sarah Jenkins", body.get("staffName"));
        assertEquals("03:00 PM – 11:00 PM (Evening)", body.get("shiftHours"));
    }

    @Test
    public void onboardingTasks_ShouldListAndToggle() {
        ResponseEntity<List<Map<String, Object>>> listResp = controller.getOnboardingTasks();
        assertNotNull(listResp);
        List<Map<String, Object>> tasks = listResp.getBody();
        assertNotNull(tasks);
        assertFalse(tasks.isEmpty());

        ResponseEntity<Map<String, Object>> toggleResp = controller.toggleOnboardingTask(1L);
        assertNotNull(toggleResp);
        assertEquals(200, toggleResp.getStatusCode().value());
    }
}
