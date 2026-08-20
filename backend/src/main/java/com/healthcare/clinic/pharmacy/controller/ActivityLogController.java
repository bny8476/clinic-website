package com.healthcare.clinic.pharmacy.controller;

import com.healthcare.clinic.pharmacy.entity.ActivityLog;
import com.healthcare.clinic.common.dto.ApiResponse;
import com.healthcare.clinic.pharmacy.service.ActivityLogService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * REST controller for activity log queries.
 * Business logic is delegated to {@link ActivityLogService}.
 */
@RestController("pharmacyActivityLogController")
@RequestMapping("/api/pharmacy/activity-log")
@org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN','ROLE_PHARMACIST')")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    public ActivityLogController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<ActivityLog>>> getLogsByUserId(
            @RequestParam Long userId,
            @RequestParam(required = false) String date,
            @org.springframework.data.web.PageableDefault(size = 10) org.springframework.data.domain.Pageable pageable) {

        com.healthcare.clinic.security.SecurityUtils.assertOwnerOrAdmin(userId);

        Page<ActivityLog> logs = activityLogService.getLogs(userId, date, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs, "Activity logs fetched"));
    }
}
