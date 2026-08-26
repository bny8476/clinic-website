package com.healthcare.clinic.config;

import com.healthcare.clinic.pharmacy.entity.*;
import com.healthcare.clinic.pharmacy.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.HashSet;
import java.util.Set;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class PharmacyDataSeeder implements CommandLineRunner {

    private final PharmacyUserRepository pharmacyUserRepository;
    private final PharmacyRoleRepository pharmacyRoleRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierPerformanceRepository supplierPerformanceRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${SEED_ADMIN_PASSWORD:AdminPass123!}")
    private String seedAdminPassword;

    @Override
    public void run(String... args) throws Exception {
        log.info("PharmacyDataSeeder: Starting pharmacy data seeding...");

        // Ensure roles are seeded (just basic ones)
        PharmacyRole sysAdminRole = pharmacyRoleRepository.findByName("ROLE_SYSTEM_ADMIN").orElseGet(() -> {
            PharmacyRole r = new PharmacyRole();
            r.setName("ROLE_SYSTEM_ADMIN");
            r.setColor("#ff0000"); // Add color to satisfy NOT NULL constraint
            // PharmacyRole does not have loginPortal, just basic fields
            return pharmacyRoleRepository.save(r);
        });

        // Seed Pharmacy User
        if (pharmacyUserRepository.count() == 0) {
            PharmacyUser pUser = new PharmacyUser();
            pUser.setUsername("admin@clinic.com");
            pUser.setEmail("admin@clinic.com");
            pUser.setName("Admin User");
            pUser.setPasswordHash(passwordEncoder.encode(seedAdminPassword));
            pUser.setStatus("ACTIVE");
            pUser.setMustChangePassword(false);
            pUser.setBranch("Main Branch");
            pUser.setShift("General 9AM–5PM");
            Set<PharmacyRole> roles = new HashSet<>();
            roles.add(sysAdminRole);
            pUser.setRoles(roles);
            pharmacyUserRepository.save(pUser);
            log.info("PharmacyDataSeeder: synced admin@clinic.com into Pharmacy DB.");
        }
        if (pharmacyUserRepository.findByUsername("pharmacist@clinic.com").isEmpty()) {
            PharmacyUser pharmacistUser = new PharmacyUser();
            pharmacistUser.setUsername("pharmacist@clinic.com");
            pharmacistUser.setEmail("pharmacist@clinic.com");
            pharmacistUser.setName("Pharma Cist");
            pharmacistUser.setPasswordHash(passwordEncoder.encode(System.getenv().getOrDefault("SEED_PHARMACIST_PASSWORD", "CHANGE_ME_PHARMACIST")));
            pharmacistUser.setStatus("ACTIVE");
            pharmacistUser.setMustChangePassword(false);
            pharmacistUser.setBranch("Main Branch");
            pharmacistUser.setShift("General 9AM–5PM");
            Set<PharmacyRole> roles = new HashSet<>();
            roles.add(sysAdminRole); // Using sysAdminRole for now, ideally ROLE_PHARMACIST
            pharmacistUser.setRoles(roles);
            pharmacyUserRepository.save(pharmacistUser);
            log.info("PharmacyDataSeeder: synced pharmacist@clinic.com into Pharmacy DB.");
        }
        // Seed Suppliers
        Supplier s1;
        if (supplierRepository.count() == 0) {
            s1 = new Supplier();
            s1.setName("MediLife Pharma");
            s1.setContactPersonName("John Doe");
            s1.setEmailAddress("contact@medilife.com");
            s1.setMobileNumber("1234567890");
            s1.setSupplierCode("SUP-001");
            s1.setAddress("123 Pharma St");
            s1.setStatus("ACTIVE");
            s1 = supplierRepository.save(s1);

            Supplier s2 = new Supplier();
            s2.setName("HealthCare Solutions");
            s2.setContactPersonName("Jane Smith");
            s2.setEmailAddress("contact@healthcaresolutions.com");
            s2.setMobileNumber("0987654321");
            s2.setSupplierCode("SUP-002");
            s2.setAddress("456 Health Ave");
            s2.setStatus("ACTIVE");
            supplierRepository.save(s2);
            log.info("PharmacyDataSeeder: Seeded suppliers.");
        } else {
            s1 = supplierRepository.findTopByOrderByIdAsc().orElseThrow();
        }

        // Seed Medicines
        Medicine m1;
        if (medicineRepository.count() == 0) {
            m1 = new Medicine();
            m1.setName("Paracetamol 500mg");
            m1.setGenericName("Paracetamol");
            m1.setCategory("Analgesic");
            m1.setReorderLevel(10);
            m1 = medicineRepository.save(m1);
            log.info("PharmacyDataSeeder: Seeded medicines.");
        } else {
            m1 = medicineRepository.findTopByOrderByIdAsc().orElseThrow();
        }

        // Seed Purchase Orders
        if (purchaseOrderRepository.count() == 0) {
            PurchaseOrder po = new PurchaseOrder();
            po.setPoNumber("PO-0001");
            po.setSupplier(s1);
            po.setPoDate(LocalDate.now().minusDays(10));
            po.setExpectedDeliveryDate(LocalDate.now().minusDays(5));
            po.setStatus("DELIVERED");
            po.setTotalValue(new BigDecimal("500.00"));
            po.setCreatedBy(1L);
            po.setSupplierName(s1.getName());
            
            List<PoLineItem> items = new ArrayList<>();
            PoLineItem item = new PoLineItem();
            item.setPurchaseOrder(po);
            item.setMedicine(m1);
            item.setMedicineName(m1.getName());
            item.setOrderedQuantity(50);
            item.setUnitPrice(new BigDecimal("10.00"));
            item.setGstPercentage(new BigDecimal("0"));
            item.setLineSubtotal(new BigDecimal("500.00"));
            item.setLineGst(new BigDecimal("0.00"));
            item.setLineTotal(new BigDecimal("500.00"));
            items.add(item);
            
            po.setLineItems(items);
            purchaseOrderRepository.save(po);
            log.info("PharmacyDataSeeder: Seeded purchase orders.");
        }

        // Seed Supplier Performance
        if (supplierPerformanceRepository.count() == 0) {
            SupplierPerformance sp1 = new SupplierPerformance();
            sp1.setSupplier(s1);
            sp1.setPeriodStart(LocalDate.now().minusMonths(1).withDayOfMonth(1));
            sp1.setPeriodEnd(LocalDate.now().minusMonths(1).withDayOfMonth(28));
            sp1.setOverallScore(94.5);
            sp1.setOnTimeDeliveryRate(95.5);
            sp1.setOrderFillRate(98.2);
            sp1.setQualityRejectionRate(0.5);
            sp1.setInvoiceAccuracyRate(99.1);
            supplierPerformanceRepository.save(sp1);
            log.info("PharmacyDataSeeder: Seeded supplier performance.");
        }

        log.info("PharmacyDataSeeder: Finished pharmacy data seeding.");
    }
}
