package com.healthcare.clinic.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    // 4 Top Primary Financial KPIs
    private BigDecimal totalRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal netProfit;
    private BigDecimal receivables;

    // 8 Secondary Operational Metrics
    private BigDecimal todayCollection;
    private BigDecimal thisMonthRevenue;
    private BigDecimal thisMonthExpenses;
    private BigDecimal pendingPayments;
    private BigDecimal vendorPayables;
    private BigDecimal payrollPayable;
    private BigDecimal bankBalance;
    private BigDecimal cashBalance;

    // Growth percentages
    private Double revenueGrowth;
    private Double expenseGrowth;
    private Double netProfitGrowth;

    // Analytics Breakdown Lists & Charts
    private List<Map<String, Object>> revenueVsExpenses; // 6-month comparative trend
    private List<Map<String, Object>> revenueByDepartment; // Pharmacy, Lab, Radiology, Consultation, IPD, Emergency
    private List<Map<String, Object>> revenueByService;
    private List<Map<String, Object>> paymentMethods; // UPI, Cash, Card, Insurance/TPA, Bank Transfer
    private List<Map<String, Object>> receivablesAging; // 0-30, 31-60, 61-90, 90+ days
    private List<Map<String, Object>> monthlyProfitLoss; // Net margins

    private Map<String, Long> claimsByStatus;
    private Long pendingExpenseApprovals;
    private Map<String, BigDecimal> branchBudgetStatus;
}
