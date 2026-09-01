package com.healthcare.clinic.analytics.opd;

import com.healthcare.clinic.analytics.core.AnalyticsBaseDTOs;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;


@Service
@RequiredArgsConstructor
public class OpdAnalyticsService {

    private final OpdAnalyticsRepository opdAnalyticsRepository;

    public Map<String, Object> getOpdDashboard(AnalyticsBaseDTOs.AnalyticsFilterRequest filter) {
        ZonedDateTime start = filter.getStartDate() != null 
                ? filter.getStartDate().atStartOfDay(ZoneId.systemDefault()) 
                : ZonedDateTime.now().minusDays(30);
        
        ZonedDateTime end = filter.getEndDate() != null 
                ? filter.getEndDate().plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusSeconds(1) 
                : ZonedDateTime.now();

        List<Object[]> dailyVolumes = opdAnalyticsRepository.getDailyVolumeByStatus(filter.getBranchId(), start, end);
        List<Object[]> specialtyVolumes = opdAnalyticsRepository.getVolumeBySpecialty(filter.getBranchId(), start, end);

        return Map.of(
                "dailyVolumes", formatDailyVolumeChart(dailyVolumes),
                "kpis", calculateOpdKpis(dailyVolumes),
                "specialtyChart", formatSpecialtyChart(specialtyVolumes)
        );
    }

    private AnalyticsBaseDTOs.ChartDataDto formatDailyVolumeChart(List<Object[]> data) {
        // Data contains: metricDate, status, total
        Map<String, Map<String, Long>> dateToStatusMap = new LinkedHashMap<>();
        
        for (Object[] row : data) {
            String date = row[0].toString();
            String status = row[1].toString();
            Long total = ((Number) row[2]).longValue();

            dateToStatusMap.putIfAbsent(date, new HashMap<>());
            dateToStatusMap.get(date).put(status, total);
        }

        List<String> labels = new ArrayList<>(dateToStatusMap.keySet());
        
        // Define specific statuses to plot
        String[] targetStatuses = {"COMPLETED", "BOOKED", "CANCELLED", "NO_SHOW"};
        List<AnalyticsBaseDTOs.DatasetDto> datasets = new ArrayList<>();

        for (String status : targetStatuses) {
            List<Object> points = new ArrayList<>();
            for (String label : labels) {
                points.add(dateToStatusMap.get(label).getOrDefault(status, 0L));
            }
            datasets.add(new AnalyticsBaseDTOs.DatasetDto(status, points, "bar"));
        }

        return new AnalyticsBaseDTOs.ChartDataDto("Appointments Over Time", "Date", "Volume", labels, datasets);
    }
    
    private AnalyticsBaseDTOs.ChartDataDto formatSpecialtyChart(List<Object[]> data) {
        List<String> labels = new ArrayList<>();
        List<Object> points = new ArrayList<>();

        for (Object[] row : data) {
            labels.add(row[0].toString());
            points.add(((Number) row[1]).longValue());
        }

        return new AnalyticsBaseDTOs.ChartDataDto(
                "Appointments by Specialty", 
                "Specialty", 
                "Volume", 
                labels, 
                List.of(new AnalyticsBaseDTOs.DatasetDto("Volume", points, "pie"))
        );
    }

    private List<AnalyticsBaseDTOs.KPIDto> calculateOpdKpis(List<Object[]> data) {
        long totalAppointments = 0;
        long completed = 0;
        long cancelled = 0;
        long noShow = 0;

        for (Object[] row : data) {
            String status = row[1].toString();
            long count = ((Number) row[2]).longValue();
            
            totalAppointments += count;
            if ("COMPLETED".equalsIgnoreCase(status)) completed += count;
            else if ("CANCELLED".equalsIgnoreCase(status)) cancelled += count;
            else if ("NO_SHOW".equalsIgnoreCase(status)) noShow += count;
        }

        return List.of(
                new AnalyticsBaseDTOs.KPIDto("Total Appointments", totalAppointments, "", null, null, "NEUTRAL", "/appointments?status=all"),
                new AnalyticsBaseDTOs.KPIDto("Completed", completed, "", null, null, "UP", "/appointments?status=COMPLETED"),
                new AnalyticsBaseDTOs.KPIDto("Cancelled", cancelled, "", null, null, "DOWN", "/appointments?status=CANCELLED"),
                new AnalyticsBaseDTOs.KPIDto("No-Shows", noShow, "", null, null, "DOWN", "/appointments?status=NO_SHOW")
        );
    }
}
