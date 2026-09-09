package com.healthcare.clinic.superadmin.controller;

import com.healthcare.clinic.tenant.entity.FeatureFlag;
import com.healthcare.clinic.tenant.service.FeatureFlagService;
import com.healthcare.clinic.superadmin.service.IntegrationService;
import com.healthcare.clinic.superadmin.service.SessionManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/super-admin/portal")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminPortalController {
    
    private final FeatureFlagService featureFlagService;
    private final IntegrationService integrationService;
    private final SessionManagementService sessionManagementService;

    @GetMapping("/feature-flags")
    public ResponseEntity<List<FeatureFlag>> getFeatureFlags() {
        return ResponseEntity.ok(featureFlagService.findAll());
    }

    @PostMapping("/feature-flags")
    public ResponseEntity<FeatureFlag> createFeatureFlag(@RequestBody FeatureFlag flag) {
        return ResponseEntity.ok(featureFlagService.save(flag));
    }
    
    @PatchMapping("/feature-flags/{id}/toggle")
    public ResponseEntity<FeatureFlag> toggleFeatureFlag(@PathVariable Long id) {
        return featureFlagService.findById(id).map(flag -> {
            flag.setIsEnabled(!Boolean.TRUE.equals(flag.getIsEnabled()));
            return ResponseEntity.ok(featureFlagService.save(flag));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions() {
        return ResponseEntity.ok(sessionManagementService.getActiveSessions());
    }
    
    @PostMapping("/sessions/{id}/revoke")
    public ResponseEntity<?> revokeSession(@PathVariable Long id) {
        sessionManagementService.revokeSession(id);
        return ResponseEntity.ok().build();
    }
}
