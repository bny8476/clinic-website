package com.healthcare.clinic.pharmacy.controller;


import com.healthcare.clinic.common.dto.ApiResponse;
import com.healthcare.clinic.pharmacy.dto.analytics.AnalyticsDashboardDTO;
import com.healthcare.clinic.pharmacy.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDateTime;
import java.time.Instant;
import java.time.ZoneId;

@RestController("pharmacyAnalyticsController")
@RequestMapping({"/api/analytics", "/api/pharmacy/analytics"})
@org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN','ROLE_PHARMACIST')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<ApiResponse<AnalyticsDashboardDTO>> getDashboardSummary(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate) {
        
        LocalDateTime start = LocalDateTime.ofInstant(startDate, ZoneId.systemDefault());
        LocalDateTime end = LocalDateTime.ofInstant(endDate, ZoneId.systemDefault());
        AnalyticsDashboardDTO summary = analyticsService.getDashboardSummary(start, end);
        return ResponseEntity.ok(ApiResponse.success(summary, "Dashboard summary retrieved successfully"));
    }

    @GetMapping("/abc-analysis")
    public ResponseEntity<ApiResponse<java.util.List<com.healthcare.clinic.pharmacy.dto.analytics.ABCAnalysisDTO>>> getAbcAnalysis(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate) {
        
        LocalDateTime start = LocalDateTime.ofInstant(startDate, ZoneId.systemDefault());
        LocalDateTime end = LocalDateTime.ofInstant(endDate, ZoneId.systemDefault());
        java.util.List<com.healthcare.clinic.pharmacy.dto.analytics.ABCAnalysisDTO> data = analyticsService.getAbcAnalysis(start, end);
        return ResponseEntity.ok(ApiResponse.success(data, "ABC Analysis retrieved successfully"));
    }

    @GetMapping("/mom-comparison")
    public ResponseEntity<ApiResponse<com.healthcare.clinic.pharmacy.dto.analytics.MonthOverMonthDTO>> getMonthOverMonthComparison(
            @RequestParam("monthAStart") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant monthAStart,
            @RequestParam("monthAEnd") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant monthAEnd,
            @RequestParam("monthBStart") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant monthBStart,
            @RequestParam("monthBEnd") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant monthBEnd) {
        
        LocalDateTime aStart = LocalDateTime.ofInstant(monthAStart, ZoneId.systemDefault());
        LocalDateTime aEnd = LocalDateTime.ofInstant(monthAEnd, ZoneId.systemDefault());
        LocalDateTime bStart = LocalDateTime.ofInstant(monthBStart, ZoneId.systemDefault());
        LocalDateTime bEnd = LocalDateTime.ofInstant(monthBEnd, ZoneId.systemDefault());
        com.healthcare.clinic.pharmacy.dto.analytics.MonthOverMonthDTO data = analyticsService.getMonthOverMonthComparison(aStart, aEnd, bStart, bEnd);
        return ResponseEntity.ok(ApiResponse.success(data, "Month over Month comparison retrieved successfully"));
    }

    @GetMapping("/stocks/movement")
    public ResponseEntity<ApiResponse<com.healthcare.clinic.pharmacy.dto.analytics.StockMovementInsightsDTO>> getStockMovementInsights(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(value = "limit", defaultValue = "50") int limit) {
        
        LocalDateTime end = endDate == null ? LocalDateTime.now() : LocalDateTime.ofInstant(endDate, ZoneId.systemDefault());
        LocalDateTime start = startDate == null ? end.minusDays(30) : LocalDateTime.ofInstant(startDate, ZoneId.systemDefault());

        com.healthcare.clinic.pharmacy.dto.analytics.StockMovementInsightsDTO dto = new com.healthcare.clinic.pharmacy.dto.analytics.StockMovementInsightsDTO();
        
        java.util.List<com.healthcare.clinic.pharmacy.dto.analytics.MedicineStatsDTO> topMoving = analyticsService.getFastMovingMedicines(start, end, limit);
        java.util.List<com.healthcare.clinic.pharmacy.dto.analytics.MedicineStatsDTO> topNonMoving = analyticsService.getSlowMovingMedicines(start, end, limit);
        
        dto.setTopMoving(topMoving);
        dto.setTopNonMoving(topNonMoving);
        
        java.math.BigDecimal movingVal = topMoving.stream()
                .map(m -> m.getStockValueLocked())
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, (a, b) -> a.add(b));
                
        java.math.BigDecimal nonMovingVal = topNonMoving.stream()
                .map(m -> m.getStockValueLocked())
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, (a, b) -> a.add(b));
                
        dto.setMovingValue(movingVal);
        dto.setNonMovingValue(nonMovingVal);

        return ResponseEntity.ok(ApiResponse.success(dto, "Stock movement insights retrieved successfully"));
    }
}
