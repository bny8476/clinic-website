package com.healthcare.clinic.radiology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RadiologyDashboardDto {
    private long todayOrders;
    private long pendingOrders;
    private long todayAppointments;
    private long waitingPatients;
    private long checkedInPatients;
    private long studiesPending;
    private long studiesInProgress;
    private long studiesCompleted;
    private long reportsPending;
    private long reportsAwaitingVerification;
    private long criticalFindings;
    private long cancelledAppointments;
    private long cancelledOrRejected;
    private long statOrUrgentCount;
    private long totalVolume;
    private Map<String, Long> statusCounts;
    private Map<String, Long> modalityWorkload;
    private Map<String, Long> priorityCounts;
}
