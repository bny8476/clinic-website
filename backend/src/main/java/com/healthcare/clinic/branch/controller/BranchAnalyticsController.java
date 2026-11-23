package com.healthcare.clinic.branch.controller;

import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/branch")
@RequiredArgsConstructor
public class BranchAnalyticsController {

    private final BranchRepository branchRepository;

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyAuthority('ROLE_BRANCH_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_STAFF', 'ROLE_DOCTOR') or isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestParam(defaultValue = "week") String range,
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) Long branchId
    ) {
        Map<String, Object> response = new HashMap<>();

        // Resolve branch info
        String branchName = "Main City Branch";
        String branchCity = "Downtown Metro";
        Long resolvedBranchId = 1L;

        if (branchId != null) {
            Optional<Branch> bOpt = branchRepository.findById(branchId);
            if (bOpt.isPresent()) {
                Branch b = bOpt.get();
                branchName = b.getName();
                branchCity = b.getCity() != null ? b.getCity() : "Metro";
                resolvedBranchId = b.getId();
            }
        } else if (branch != null && !branch.isBlank()) {
            branchName = branch;
            List<Branch> all = branchRepository.findAll();
            for (Branch b : all) {
                if (b.getName() != null && b.getName().equalsIgnoreCase(branch)) {
                    branchCity = b.getCity() != null ? b.getCity() : "Metro";
                    resolvedBranchId = b.getId();
                    break;
                }
            }
        } else {
            Optional<Branch> firstBranch = branchRepository.findFirstByOrderByIdAsc();
            if (firstBranch.isPresent()) {
                Branch b = firstBranch.get();
                branchName = b.getName();
                branchCity = b.getCity() != null ? b.getCity() : "Metro";
                resolvedBranchId = b.getId();
            }
        }

        Map<String, Object> branchInfo = new HashMap<>();
        branchInfo.put("id", resolvedBranchId);
        branchInfo.put("name", branchName);
        branchInfo.put("city", branchCity);
        response.put("branchInfo", branchInfo);
        response.put("branch", branchName);
        response.put("range", range);

        // Daily / Period Chart data
        List<Map<String, Object>> dailyData = new ArrayList<>();
        List<Map<String, Object>> kpis = new ArrayList<>();

        if ("today".equalsIgnoreCase(range)) {
            dailyData.add(periodData("08:00", 12, 4800, 14, 12));
            dailyData.add(periodData("10:00", 28, 11200, 30, 27));
            dailyData.add(periodData("12:00", 35, 14000, 36, 34));
            dailyData.add(periodData("14:00", 19, 7600, 22, 19));
            dailyData.add(periodData("16:00", 26, 10400, 28, 25));
            dailyData.add(periodData("18:00", 16, 6400, 18, 15));
            dailyData.add(periodData("20:00", 6, 2400, 7, 6));

            kpis.add(kpi("daily_footfall", "Daily Footfall", "142", "+14.2%", true, "vs yesterday (124)"));
            kpis.add(kpi("gross_revenue", "Gross Revenue", "₹56,800", "+8.6%", true, "₹4,200 above target"));
            kpis.add(kpi("avg_wait_time", "Avg Wait Time", "13 min", "-13.3%", true, "2m faster than avg"));
            kpis.add(kpi("opd_consults", "OPD Consults", "89", "+11.4%", true, "Across 6 specialties"));
            kpis.add(kpi("bed_occupancy", "Bed Occupancy", "84.4%", "+2.1%", true, "38 / 45 Active Beds"));
            kpis.add(kpi("doctor_utilization", "Specialist Utilization", "88.5%", "+3.2%", true, "14 On-Duty Doctors"));
        } else if ("month".equalsIgnoreCase(range)) {
            dailyData.add(periodData("Week 1", 840, 310000, 890, 830));
            dailyData.add(periodData("Week 2", 920, 345000, 960, 905));
            dailyData.add(periodData("Week 3", 1100, 412000, 1140, 1080));
            dailyData.add(periodData("Week 4", 980, 368000, 1020, 970));

            kpis.add(kpi("monthly_footfall", "Monthly Footfall", "3,840", "+9.8%", true, "vs last month (3,498)"));
            kpis.add(kpi("gross_revenue", "Gross Revenue", "₹14,35,000", "+11.2%", true, "104% of monthly target"));
            kpis.add(kpi("avg_wait_time", "Avg Wait Time", "12 min", "-8.0%", true, "Consistent SLA < 15m"));
            kpis.add(kpi("opd_consults", "OPD Consults", "2,410", "+10.1%", true, "98.4% diagnostic rate"));
            kpis.add(kpi("bed_occupancy", "Bed Occupancy", "82.2%", "+1.5%", true, "37 / 45 Beds Average"));
            kpis.add(kpi("doctor_utilization", "Specialist Utilization", "89.2%", "+2.4%", true, "8 Clinical Departments"));
        } else if ("quarter".equalsIgnoreCase(range)) {
            dailyData.add(periodData("Month 1", 3450, 1280000, 3600, 3400));
            dailyData.add(periodData("Month 2", 3780, 1410000, 3950, 3720));
            dailyData.add(periodData("Month 3", 4120, 1540000, 4300, 4080));

            kpis.add(kpi("quarterly_footfall", "Quarterly Footfall", "11,350", "+12.7%", true, "Growth across all units"));
            kpis.add(kpi("gross_revenue", "Gross Revenue", "₹42,30,000", "+14.5%", true, "Surpassed Q-budget"));
            kpis.add(kpi("avg_wait_time", "Avg Wait Time", "12 min", "-10.5%", true, "Peak efficiency maintained"));
            kpis.add(kpi("opd_consults", "OPD Consults", "7,180", "+13.1%", true, "Patient satisfaction 4.88/5"));
            kpis.add(kpi("bed_occupancy", "Bed Occupancy", "83.6%", "+3.1%", true, "Optimal ward turnaround"));
            kpis.add(kpi("doctor_utilization", "Specialist Utilization", "87.8%", "+1.9%", true, "High clinical retention"));
        } else if ("year".equalsIgnoreCase(range)) {
            dailyData.add(periodData("Q1", 9700, 3640000, 10200, 9550));
            dailyData.add(periodData("Q2", 11340, 4260000, 11800, 11200));
            dailyData.add(periodData("Q3", 10890, 4080000, 11400, 10750));
            dailyData.add(periodData("Q4", 12450, 4680000, 13100, 12350));

            kpis.add(kpi("annual_footfall", "Annual Footfall", "44,380", "+15.6%", true, "YoY patient volume up"));
            kpis.add(kpi("gross_revenue", "Annual Revenue", "₹1,66,60,000", "+18.2%", true, "Record annual revenue"));
            kpis.add(kpi("avg_wait_time", "Avg Wait Time", "11 min", "-15.4%", true, "Continuous workflow lean"));
            kpis.add(kpi("opd_consults", "OPD Consults", "28,900", "+16.8%", true, "High patient loyalty score"));
            kpis.add(kpi("bed_occupancy", "Bed Occupancy", "84.0%", "+4.0%", true, "Capacity expansion planned"));
            kpis.add(kpi("doctor_utilization", "Specialist Utilization", "89.5%", "+3.5%", true, "16 Active Consultants"));
        } else {
            // Default: Week
            dailyData.add(periodData("Mon", 118, 42000, 125, 114));
            dailyData.add(periodData("Tue", 134, 48500, 140, 132));
            dailyData.add(periodData("Wed", 142, 51200, 148, 139));
            dailyData.add(periodData("Thu", 127, 45600, 132, 125));
            dailyData.add(periodData("Fri", 163, 58900, 170, 161));
            dailyData.add(periodData("Sat", 98, 35100, 105, 96));
            dailyData.add(periodData("Sun", 71, 25400, 75, 70));

            kpis.add(kpi("weekly_footfall", "Weekly Footfall", "853", "+12.4%", true, "vs last week (759)"));
            kpis.add(kpi("gross_revenue", "Gross Revenue", "₹3,06,700", "+9.5%", true, "₹26,000 above weekly goal"));
            kpis.add(kpi("avg_wait_time", "Avg Wait Time", "13 min", "-9.2%", true, "Best in Metro cluster"));
            kpis.add(kpi("opd_consults", "OPD Consults", "537", "+8.7%", true, "Across 6 specialties"));
            kpis.add(kpi("bed_occupancy", "Bed Occupancy", "84.4%", "+2.1%", true, "38 / 45 Active Beds"));
            kpis.add(kpi("doctor_utilization", "Specialist Utilization", "88.5%", "+4.1%", true, "14 On-Duty Doctors"));
        }

        response.put("dailyData", dailyData);
        response.put("kpis", kpis);

        // Monthly trend data (6-month longitudinal view)
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        monthlyData.add(trendData("May", 2800, 1050000, 96.2));
        monthlyData.add(trendData("Jun", 3100, 1180000, 97.0));
        monthlyData.add(trendData("Jul", 2950, 1120000, 95.8));
        monthlyData.add(trendData("Aug", 3200, 1240000, 97.5));
        monthlyData.add(trendData("Sep", 3450, 1310000, 98.1));
        monthlyData.add(trendData("Oct", 3600, 1380000, 98.6));
        response.put("monthlyData", monthlyData);

        // Department Statistics Breakdown
        List<Map<String, Object>> departmentStats = new ArrayList<>();
        departmentStats.add(deptStat("General Medicine", 340, 850000, 4, 14, 28, "Optimal", "emerald"));
        departmentStats.add(deptStat("Cardiology", 180, 540000, 2, 16, 22, "High Load", "blue"));
        departmentStats.add(deptStat("Pediatrics", 210, 315000, 2, 11, 14, "Optimal", "emerald"));
        departmentStats.add(deptStat("Orthopedics", 165, 495000, 2, 18, 16, "Optimal", "emerald"));
        departmentStats.add(deptStat("Emergency & Trauma", 285, 399000, 3, 5, 12, "Critical 24/7", "rose"));
        departmentStats.add(deptStat("Radiology & Lab", 145, 290000, 1, 12, 8, "Optimal", "indigo"));
        response.put("departmentStats", departmentStats);

        // Doctor Performance & Workload Roster
        List<Map<String, Object>> doctorPerformance = new ArrayList<>();
        doctorPerformance.add(doctor("DOC-101", "Dr. Sarah Jenkins", "Cardiology", 34, "14 min", 4.9, "ON_DUTY", "Room 102"));
        doctorPerformance.add(doctor("DOC-102", "Dr. Rajesh Mehta", "General Medicine", 42, "12 min", 4.8, "IN_CONSULTATION", "Room 105"));
        doctorPerformance.add(doctor("DOC-103", "Dr. Ananya Sharma", "Pediatrics", 28, "15 min", 4.9, "ON_DUTY", "Room 108"));
        doctorPerformance.add(doctor("DOC-104", "Dr. Vikram Rao", "Orthopedics", 26, "18 min", 4.7, "ON_CALL", "OT Bay 2"));
        doctorPerformance.add(doctor("DOC-105", "Dr. Priya Patel", "Emergency Medicine", 38, "9 min", 4.9, "ON_DUTY", "Triage A"));
        doctorPerformance.add(doctor("DOC-106", "Dr. Sunita Menon", "Radiology & Imaging", 22, "13 min", 4.8, "ON_DUTY", "Diagnostic Lab"));
        response.put("doctorPerformance", doctorPerformance);

        // Appointment Adherence & Status distribution
        Map<String, Object> appointmentDistribution = new HashMap<>();
        appointmentDistribution.put("completed", 78);
        appointmentDistribution.put("inProgress", 12);
        appointmentDistribution.put("cancelled", 6);
        appointmentDistribution.put("noShow", 4);
        appointmentDistribution.put("totalBooked", 895);
        response.put("appointmentDistribution", appointmentDistribution);

        // Operational & Resource Status
        Map<String, Object> operationalStatus = new HashMap<>();
        operationalStatus.put("occupancyRate", 84);
        operationalStatus.put("activeBeds", 38);
        operationalStatus.put("totalBeds", 45);
        operationalStatus.put("onDutyDoctors", 14);
        operationalStatus.put("activeSpecialties", 8);
        operationalStatus.put("pharmacyDispatches", 186);
        operationalStatus.put("fulfillmentRate", 99.2);
        operationalStatus.put("emergencyBays", 6);
        operationalStatus.put("ambulancesReady", 4);
        operationalStatus.put("equipmentUptime", 99.1);
        response.put("operationalStatus", operationalStatus);

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> periodData(String label, int footfall, int revenue, int appointments, int completed) {
        Map<String, Object> data = new HashMap<>();
        data.put("day", label);
        data.put("month", label);
        data.put("label", label);
        data.put("footfall", footfall);
        data.put("revenue", revenue);
        data.put("appointments", appointments);
        data.put("completed", completed);
        return data;
    }

    private Map<String, Object> trendData(String month, int footfall, int revenue, double satisfaction) {
        Map<String, Object> data = new HashMap<>();
        data.put("month", month);
        data.put("footfall", footfall);
        data.put("revenue", revenue);
        data.put("satisfaction", satisfaction);
        return data;
    }

    private Map<String, Object> kpi(String key, String label, String value, String change, boolean isPositive, String subtext) {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("key", key);
        kpi.put("label", label);
        kpi.put("value", value);
        kpi.put("change", change);
        kpi.put("isPositive", isPositive);
        kpi.put("subtext", subtext);
        return kpi;
    }

    private Map<String, Object> deptStat(String name, int patients, int revenue, int doctors, int avgWait, int share, String status, String color) {
        Map<String, Object> dept = new HashMap<>();
        dept.put("name", name);
        dept.put("patients", patients);
        dept.put("revenue", revenue);
        dept.put("doctors", doctors);
        dept.put("avgWait", avgWait);
        dept.put("share", share);
        dept.put("status", status);
        dept.put("color", color);
        return dept;
    }

    private Map<String, Object> doctor(String id, String name, String specialty, int consultations, String avgTime, double rating, String status, String location) {
        Map<String, Object> doc = new HashMap<>();
        doc.put("id", id);
        doc.put("name", name);
        doc.put("specialty", specialty);
        doc.put("consultations", consultations);
        doc.put("avgTime", avgTime);
        doc.put("rating", rating);
        doc.put("status", status);
        doc.put("location", location);
        return doc;
    }
}
