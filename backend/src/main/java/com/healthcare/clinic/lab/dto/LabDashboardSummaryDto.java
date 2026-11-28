package com.healthcare.clinic.lab.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabDashboardSummaryDto {
    private long totalRequests;
    private long requestsToday;
    private long pendingRequests;
    private long inProgressRequests;
    private long verifiedRequests;
    private long completedRequests;
    private long urgentRequests;
    private long rejectedRequests;
    private Map<String, Long> statusCounts;
    private Map<String, Long> priorityCounts;
    private long lowStockItems;
    private List<Map<String, Object>> tatData;
}
