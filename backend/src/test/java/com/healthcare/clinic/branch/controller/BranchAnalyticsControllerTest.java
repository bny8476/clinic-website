package com.healthcare.clinic.branch.controller;

import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BranchAnalyticsControllerTest {

    @Mock
    private BranchRepository branchRepository;

    @InjectMocks
    private BranchAnalyticsController controller;

    private Branch mockBranch;

    @BeforeEach
    public void setup() {
        mockBranch = Branch.builder()
                .id(1L)
                .name("Main City Branch")
                .city("Metro")
                .build();
    }

    @Test
    public void getAnalytics_DefaultWeekRange_ShouldReturnFullMetrics() {
        when(branchRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(mockBranch));

        ResponseEntity<Map<String, Object>> response = controller.getAnalytics("week", null, null);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());

        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("week", body.get("range"));
        assertEquals("Main City Branch", body.get("branch"));

        // Validate KPIs
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> kpis = (List<Map<String, Object>>) body.get("kpis");
        assertNotNull(kpis);
        assertEquals(6, kpis.size());

        // Validate Daily Data (Week: Mon-Sun)
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> dailyData = (List<Map<String, Object>>) body.get("dailyData");
        assertNotNull(dailyData);
        assertEquals(7, dailyData.size());
        assertEquals("Mon", dailyData.get(0).get("day"));

        // Validate Department Stats
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> deptStats = (List<Map<String, Object>>) body.get("departmentStats");
        assertNotNull(deptStats);
        assertEquals(6, deptStats.size());

        // Validate Doctor Workload
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> doctors = (List<Map<String, Object>>) body.get("doctorPerformance");
        assertNotNull(doctors);
        assertEquals(6, doctors.size());

        // Validate Operational Status
        @SuppressWarnings("unchecked")
        Map<String, Object> operational = (Map<String, Object>) body.get("operationalStatus");
        assertNotNull(operational);
        assertEquals(84, operational.get("occupancyRate"));
        assertEquals(38, operational.get("activeBeds"));
        assertEquals(45, operational.get("totalBeds"));

        // Validate Appointment Adherence
        @SuppressWarnings("unchecked")
        Map<String, Object> adherence = (Map<String, Object>) body.get("appointmentDistribution");
        assertNotNull(adherence);
        assertEquals(78, adherence.get("completed"));
        assertEquals(12, adherence.get("inProgress"));
    }

    @Test
    public void getAnalytics_TodayRange_ShouldReturnHourlyMetrics() {
        when(branchRepository.findAll()).thenReturn(List.of(mockBranch));

        ResponseEntity<Map<String, Object>> response = controller.getAnalytics("today", "Main City Branch", null);

        assertNotNull(response);
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("today", body.get("range"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> dailyData = (List<Map<String, Object>>) body.get("dailyData");
        assertNotNull(dailyData);
        assertEquals("08:00", dailyData.get(0).get("day"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> kpis = (List<Map<String, Object>>) body.get("kpis");
        assertNotNull(kpis);
        assertEquals("Daily Footfall", kpis.get(0).get("label"));
    }

    @Test
    public void getAnalytics_MonthAndYearRanges_ShouldReturnAppropriatePeriods() {
        when(branchRepository.findById(1L)).thenReturn(Optional.of(mockBranch));

        // Month
        ResponseEntity<Map<String, Object>> monthRes = controller.getAnalytics("month", null, 1L);
        assertNotNull(monthRes);
        Map<String, Object> monthBody = monthRes.getBody();
        assertNotNull(monthBody);
        assertEquals("month", monthBody.get("range"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> monthDaily = (List<Map<String, Object>>) monthBody.get("dailyData");
        assertEquals("Week 1", monthDaily.get(0).get("day"));

        // Year
        ResponseEntity<Map<String, Object>> yearRes = controller.getAnalytics("year", null, 1L);
        assertNotNull(yearRes);
        Map<String, Object> yearBody = yearRes.getBody();
        assertNotNull(yearBody);
        assertEquals("year", yearBody.get("range"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> yearDaily = (List<Map<String, Object>>) yearBody.get("dailyData");
        assertEquals("Q1", yearDaily.get(0).get("day"));
    }
}
