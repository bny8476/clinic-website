package com.healthcare.clinic.superadmin.repository;
import com.healthcare.clinic.integration.entity.IntegrationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface IntegrationConfigRepository extends JpaRepository<IntegrationConfig, Long> {}
