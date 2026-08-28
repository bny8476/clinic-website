package com.healthcare.clinic.branch.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/branch")
@RequiredArgsConstructor
public class BranchAnalyticsController {

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestParam(defaultValue = "week") String range,
            @RequestParam(required = false) String branch
    ) {

        Map<String, Object> response = new HashMap<>();

        response.put("range", range);
        response.put("branch", branch != null ? branch : "Main City Branch");

        // Daily chart data
        List<Map<String, Object>> dailyData = new ArrayList<>();

        if ("month".equalsIgnoreCase(range)) {
            dailyData.add(data("Week 1", 840, 310000));
            dailyData.add(data("Week 2", 920, 345000));
            dailyData.add(data("Week 3", 1100, 412000));
            dailyData.add(data("Week 4", 980, 368000));
        } else if ("year".equalsIgnoreCase(range)) {
            dailyData.add(data("Q1", 9700, 3640000));
            dailyData.add(data("Q2", 11340, 4260000));
            dailyData.add(data("Q3", 10890, 4080000));
            dailyData.add(data("Q4", 12450, 4680000));
        } else {
            dailyData.add(data("Mon", 118, 42000));
            dailyData.add(data("Tue", 134, 48500));
            dailyData.add(data("Wed", 142, 51200));
            dailyData.add(data("Thu", 127, 45600));
            dailyData.add(data("Fri", 163, 58900));
            dailyData.add(data("Sat", 98, 35100));
            dailyData.add(data("Sun", 71, 25400));
        }

        response.put("dailyData", dailyData);

        // KPI data
        List<Map<String, Object>> kpis = new ArrayList<>();

        if ("month".equalsIgnoreCase(range)) {
            kpis.add(kpi("Monthly Footfall", "3,840"));
            kpis.add(kpi("Gross Revenue", "₹14,35,000"));
            kpis.add(kpi("Avg Wait Time", "12 min"));
            kpis.add(kpi("OPD Consults", "2,410"));
        } else if ("year".equalsIgnoreCase(range)) {
            kpis.add(kpi("Annual Footfall", "44,380"));
            kpis.add(kpi("Annual Revenue", "₹1,66,60,000"));
            kpis.add(kpi("Avg Wait Time", "11 min"));
            kpis.add(kpi("OPD Consults", "28,900"));
        } else {
            kpis.add(kpi("Daily Footfall", "142"));
            kpis.add(kpi("Gross Revenue", "₹51,200"));
            kpis.add(kpi("Avg Wait Time", "14 min"));
            kpis.add(kpi("OPD Consults", "89"));
        }

        response.put("kpis", kpis);

        // Monthly trend data
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        monthlyData.add(data("Jan", 2800, 105000));
        monthlyData.add(data("Feb", 3100, 118000));
        monthlyData.add(data("Mar", 2950, 112000));
        monthlyData.add(data("Apr", 3200, 124000));
        monthlyData.add(data("May", 3450, 131000));
        monthlyData.add(data("Jun", 3600, 138000));

        response.put("monthlyData", monthlyData);

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> data(String label, int footfall, int revenue) {
        Map<String, Object> data = new HashMap<>();
        data.put("day", label);
        data.put("month", label);
        data.put("footfall", footfall);
        data.put("revenue", revenue);
        return data;
    }

    private Map<String, Object> kpi(String label, String value) {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("label", label);
        kpi.put("value", value);
        return kpi;
    }
}
