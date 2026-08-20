package com.healthcare.clinic.superadmin.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import lombok.*;

@Entity
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Table(name = "superadmin_integration_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String providerName;

    @Column(nullable = false)
    private String integrationType; // SMS, PAYMENT, LAB

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(columnDefinition = "TEXT")
    private String encryptedCredentials;

    private boolean active;
}
