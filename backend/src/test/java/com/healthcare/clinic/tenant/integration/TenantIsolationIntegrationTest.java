package com.healthcare.clinic.tenant.integration;
import com.healthcare.clinic.billing.entity.Invoice;
import com.healthcare.clinic.billing.repository.InvoiceRepository;
import com.healthcare.clinic.billing.entity.InvoiceStatus;
import com.healthcare.clinic.tenant.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class TenantIsolationIntegrationTest {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private com.healthcare.clinic.tenant.repository.TenantRepository tenantRepository;

    private Long tenant1Id;
    private Long tenant2Id;

    @BeforeEach
    void setUp() {
        // Create test patients for two different tenants
        TenantContextHolder.setTenantId(1L);
        com.healthcare.clinic.tenant.entity.Tenant t1 = com.healthcare.clinic.tenant.entity.Tenant.builder()
                .name("Tenant 1")
                .status("ACTIVE")
                .build();
        t1 = tenantRepository.save(t1);
        tenant1Id = t1.getId();

        invoiceRepository.save(Invoice.builder()
                .tenant(t1)
                .invoiceNumber("INV-100")
                .description("Consultation")
                .patientId(1L)
                .amount(java.math.BigDecimal.valueOf(100.00))
                .dueDate(java.time.LocalDateTime.now().plusDays(7))
                .status(InvoiceStatus.DRAFT)
                .build());

        TenantContextHolder.setTenantId(2L);
        com.healthcare.clinic.tenant.entity.Tenant t2 = com.healthcare.clinic.tenant.entity.Tenant.builder()
                .name("Tenant 2")
                .status("ACTIVE")
                .build();
        t2 = tenantRepository.save(t2);
        tenant2Id = t2.getId();

        invoiceRepository.save(Invoice.builder()
                .tenant(t2)
                .invoiceNumber("INV-200")
                .description("Consultation 2")
                .patientId(2L)
                .amount(java.math.BigDecimal.valueOf(200.00))
                .dueDate(java.time.LocalDateTime.now().plusDays(7))
                .status(InvoiceStatus.DRAFT)
                .build());
                
        TenantContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clearContext();
    }

    @Test
    void testTenant1OnlySeesOwnInvoices() {
        TenantContextHolder.setTenantId(tenant1Id);
        
        List<Invoice> invoices = invoiceRepository.findAll();
        
        assertThat(invoices).hasSize(1);
        assertThat(invoices.get(0).getInvoiceNumber()).isEqualTo("INV-100");
    }

    @Test
    void testTenant2OnlySeesOwnInvoices() {
        TenantContextHolder.setTenantId(tenant2Id);
        
        List<Invoice> invoices = invoiceRepository.findAll();
        
        assertThat(invoices).hasSize(1);
        assertThat(invoices.get(0).getInvoiceNumber()).isEqualTo("INV-200");
    }
}
