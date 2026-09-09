package com.healthcare.clinic.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDto {
    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long doctorsCount;
    private long nursesCount;
    private long pharmacistsCount;
    private long labStaffCount;
    private long receptionistsCount;
}
