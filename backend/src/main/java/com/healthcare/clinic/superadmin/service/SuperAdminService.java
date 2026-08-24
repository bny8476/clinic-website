package com.healthcare.clinic.superadmin.service;

import com.healthcare.clinic.superadmin.entity.SuperAdminAuditLog;
import com.healthcare.clinic.superadmin.entity.SubscriptionPlan;
import com.healthcare.clinic.superadmin.entity.SystemConfiguration;
import com.healthcare.clinic.superadmin.repository.AuditLogRepository;
import com.healthcare.clinic.superadmin.repository.SubscriptionPlanRepository;
import com.healthcare.clinic.superadmin.repository.SystemConfigurationRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SuperAdminService {

    private final SystemConfigurationRepository configRepo;
    private final SubscriptionPlanRepository planRepo;
    private final AuditLogRepository auditRepo;

    public SuperAdminService(SystemConfigurationRepository configRepo,
                             SubscriptionPlanRepository planRepo,
                             @Qualifier("superAdminAuditLogRepository") AuditLogRepository auditRepo) {
        this.configRepo = configRepo;
        this.planRepo = planRepo;
        this.auditRepo = auditRepo;
    }

    // ── Platform Stats ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getPlatformStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPlans", planRepo.count());
        stats.put("activePlans", planRepo.findByIsActiveTrue().size());
        stats.put("totalConfigs", configRepo.count());
        stats.put("auditLogCount", auditRepo.count());
        return stats;
    }

    // ── System Configuration ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable("systemConfigs")
    public List<SystemConfiguration> getAllConfigs() {
        return configRepo.findAll();
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "systemConfigs", allEntries = true)
    public SystemConfiguration updateConfig(Long id, String value, String updatedBy) {
        SystemConfiguration config = configRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Config not found: " + id));
        config.setConfigVal(value);
        config.setUpdatedBy(updatedBy);
        config.setUpdatedAt(ZonedDateTime.now());
        return configRepo.save(config);
    }

    // ── Subscription Plans ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getAllPlans() {
        return planRepo.findAll();
    }

    @Transactional
    public SubscriptionPlan createPlan(SubscriptionPlan plan) {
        return planRepo.save(plan);
    }

    @Transactional
    public SubscriptionPlan togglePlanStatus(Long id) {
        SubscriptionPlan plan = planRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found: " + id));
        plan.setIsActive(!Boolean.TRUE.equals(plan.getIsActive()));
        return planRepo.save(plan);
    }

    // ── Platform Audit Logs ────────────────────────────────────────────────---

    @Transactional(readOnly = true)
    public Page<SuperAdminAuditLog> getAuditLogs(int page, int size) {
        return auditRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Transactional
    public void logPlatformAction(Long actorId, String actorEmail, String action, String details, String ipAddress) {
        SuperAdminAuditLog log = new SuperAdminAuditLog();
        log.setActorId(actorId);
        log.setActorEmail(actorEmail);
        log.setAction(action);
        log.setDetails(details);
        log.setIpAddress(ipAddress);
        log.setCreatedAt(ZonedDateTime.now());
        auditRepo.save(log);
    }
}
