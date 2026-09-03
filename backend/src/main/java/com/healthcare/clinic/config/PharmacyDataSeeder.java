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

        // Seed Authentic Indian Medicines
        Medicine m1;
        if (medicineRepository.count() == 0) {
            Medicine mAugmentin = new Medicine();
            mAugmentin.setName("Augmentin 625 Duo Tablet");
            mAugmentin.setGenericName("Amoxicillin (500mg) + Clavulanic Acid (125mg)");
            mAugmentin.setManufacturer("GlaxoSmithKline Pharmaceuticals Ltd");
            mAugmentin.setCategory("Tablet");
            mAugmentin.setDrugClass("Antibiotic");
            mAugmentin.setUnit("Strip");
            mAugmentin.setPackSize("10 Tablets/Strip");
            mAugmentin.setHsnCode("3004");
            mAugmentin.setTaxPercentage(new BigDecimal("12.0"));
            mAugmentin.setMrp(new BigDecimal("201.50"));
            mAugmentin.setPurchasePrice(new BigDecimal("155.00"));
            mAugmentin.setSalePrice(new BigDecimal("190.00"));
            mAugmentin.setSchedule("Schedule H1");
            mAugmentin.setReorderLevel(20);
            mAugmentin.setMedicineCode("IND-MED-101");
            mAugmentin.setBarcode("8901234560101");
            m1 = medicineRepository.save(mAugmentin);

            Medicine mDolo = new Medicine();
            mDolo.setName("Dolo 650 Tablet");
            mDolo.setGenericName("Paracetamol (650mg)");
            mDolo.setManufacturer("Micro Labs Ltd");
            mDolo.setCategory("Tablet");
            mDolo.setDrugClass("Analgesic");
            mDolo.setUnit("Strip");
            mDolo.setPackSize("15 Tablets/Strip");
            mDolo.setHsnCode("3004");
            mDolo.setTaxPercentage(new BigDecimal("12.0"));
            mDolo.setMrp(new BigDecimal("30.80"));
            mDolo.setPurchasePrice(new BigDecimal("22.00"));
            mDolo.setSalePrice(new BigDecimal("28.50"));
            mDolo.setSchedule("OTC");
            mDolo.setReorderLevel(50);
            mDolo.setMedicineCode("IND-MED-102");
            mDolo.setBarcode("8901234560102");
            medicineRepository.save(mDolo);

            Medicine mPanD = new Medicine();
            mPanD.setName("Pan-D Capsule");
            mPanD.setGenericName("Pantoprazole (40mg) + Domperidone (30mg)");
            mPanD.setManufacturer("Alkem Laboratories Ltd");
            mPanD.setCategory("Capsule");
            mPanD.setDrugClass("Antacid");
            mPanD.setUnit("Strip");
            mPanD.setPackSize("15 Capsules/Strip");
            mPanD.setHsnCode("3004");
            mPanD.setTaxPercentage(new BigDecimal("12.0"));
            mPanD.setMrp(new BigDecimal("199.00"));
            mPanD.setPurchasePrice(new BigDecimal("145.00"));
            mPanD.setSalePrice(new BigDecimal("185.00"));
            mPanD.setSchedule("Schedule H");
            mPanD.setReorderLevel(25);
            mPanD.setMedicineCode("IND-MED-103");
            mPanD.setBarcode("8901234560103");
            medicineRepository.save(mPanD);

            Medicine mGlycomet = new Medicine();
            mGlycomet.setName("Glycomet GP 2 Tablet");
            mGlycomet.setGenericName("Glimepiride (2mg) + Metformin (500mg)");
            mGlycomet.setManufacturer("USV Pvt Ltd");
            mGlycomet.setCategory("Tablet");
            mGlycomet.setDrugClass("Antidiabetic");
            mGlycomet.setUnit("Strip");
            mGlycomet.setPackSize("15 Tablets/Strip");
            mGlycomet.setHsnCode("3004");
            mGlycomet.setTaxPercentage(new BigDecimal("12.0"));
            mGlycomet.setMrp(new BigDecimal("115.50"));
            mGlycomet.setPurchasePrice(new BigDecimal("85.00"));
            mGlycomet.setSalePrice(new BigDecimal("108.00"));
            mGlycomet.setSchedule("Schedule H");
            mGlycomet.setReorderLevel(30);
            mGlycomet.setMedicineCode("IND-MED-104");
            mGlycomet.setBarcode("8901234560104");
            medicineRepository.save(mGlycomet);

            Medicine mTelma = new Medicine();
            mTelma.setName("Telma 40 Tablet");
            mTelma.setGenericName("Telmisartan (40mg)");
            mTelma.setManufacturer("Glenmark Pharmaceuticals Ltd");
            mTelma.setCategory("Tablet");
            mTelma.setDrugClass("Antihypertensive");
            mTelma.setUnit("Strip");
            mTelma.setPackSize("15 Tablets/Strip");
            mTelma.setHsnCode("3004");
            mTelma.setTaxPercentage(new BigDecimal("12.0"));
            mTelma.setMrp(new BigDecimal("108.00"));
            mTelma.setPurchasePrice(new BigDecimal("80.00"));
            mTelma.setSalePrice(new BigDecimal("100.00"));
            mTelma.setSchedule("Schedule H");
            mTelma.setReorderLevel(25);
            mTelma.setMedicineCode("IND-MED-105");
            mTelma.setBarcode("8901234560105");
            medicineRepository.save(mTelma);

            Medicine mAzithral = new Medicine();
            mAzithral.setName("Azithral 500 Tablet");
            mAzithral.setGenericName("Azithromycin (500mg)");
            mAzithral.setManufacturer("Alembic Pharmaceuticals Ltd");
            mAzithral.setCategory("Tablet");
            mAzithral.setDrugClass("Antibiotic");
            mAzithral.setUnit("Strip");
            mAzithral.setPackSize("5 Tablets/Strip");
            mAzithral.setHsnCode("3004");
            mAzithral.setTaxPercentage(new BigDecimal("12.0"));
            mAzithral.setMrp(new BigDecimal("119.50"));
            mAzithral.setPurchasePrice(new BigDecimal("88.00"));
            mAzithral.setSalePrice(new BigDecimal("112.00"));
            mAzithral.setSchedule("Schedule H1");
            mAzithral.setReorderLevel(15);
            mAzithral.setMedicineCode("IND-MED-106");
            mAzithral.setBarcode("8901234560106");
            medicineRepository.save(mAzithral);

            Medicine mMontair = new Medicine();
            mMontair.setName("Montair LC Tablet");
            mMontair.setGenericName("Montelukast (10mg) + Levocetirizine (5mg)");
            mMontair.setManufacturer("Cipla Ltd");
            mMontair.setCategory("Tablet");
            mMontair.setDrugClass("Antihistamine");
            mMontair.setUnit("Strip");
            mMontair.setPackSize("10 Tablets/Strip");
            mMontair.setHsnCode("3004");
            mMontair.setTaxPercentage(new BigDecimal("12.0"));
            mMontair.setMrp(new BigDecimal("212.00"));
            mMontair.setPurchasePrice(new BigDecimal("158.00"));
            mMontair.setSalePrice(new BigDecimal("198.00"));
            mMontair.setSchedule("Schedule H");
            mMontair.setReorderLevel(20);
            mMontair.setMedicineCode("IND-MED-107");
            mMontair.setBarcode("8901234560107");
            medicineRepository.save(mMontair);

            Medicine mAztor = new Medicine();
            mAztor.setName("Aztor 10 Tablet");
            mAztor.setGenericName("Atorvastatin (10mg)");
            mAztor.setManufacturer("Sun Pharmaceutical Industries Ltd");
            mAztor.setCategory("Tablet");
            mAztor.setDrugClass("Lipid-Lowering");
            mAztor.setUnit("Strip");
            mAztor.setPackSize("15 Tablets/Strip");
            mAztor.setHsnCode("3004");
            mAztor.setTaxPercentage(new BigDecimal("12.0"));
            mAztor.setMrp(new BigDecimal("78.40"));
            mAztor.setPurchasePrice(new BigDecimal("56.00"));
            mAztor.setSalePrice(new BigDecimal("72.00"));
            mAztor.setSchedule("Schedule H");
            mAztor.setReorderLevel(25);
            mAztor.setMedicineCode("IND-MED-108");
            mAztor.setBarcode("8901234560108");
            medicineRepository.save(mAztor);

            Medicine mShelcal = new Medicine();
            mShelcal.setName("Shelcal 500 Tablet");
            mShelcal.setGenericName("Elemental Calcium (500mg) + Vitamin D3 (250 IU)");
            mShelcal.setManufacturer("Torrent Pharmaceuticals Ltd");
            mShelcal.setCategory("Tablet");
            mShelcal.setDrugClass("Nutritional Supplement");
            mShelcal.setUnit("Strip");
            mShelcal.setPackSize("15 Tablets/Strip");
            mShelcal.setHsnCode("3004");
            mShelcal.setTaxPercentage(new BigDecimal("12.0"));
            mShelcal.setMrp(new BigDecimal("131.30"));
            mShelcal.setPurchasePrice(new BigDecimal("95.00"));
            mShelcal.setSalePrice(new BigDecimal("122.00"));
            mShelcal.setSchedule("OTC");
            mShelcal.setReorderLevel(30);
            mShelcal.setMedicineCode("IND-MED-109");
            mShelcal.setBarcode("8901234560109");
            medicineRepository.save(mShelcal);

            Medicine mTaxim = new Medicine();
            mTaxim.setName("Taxim-O 200 Tablet");
            mTaxim.setGenericName("Cefixime (200mg)");
            mTaxim.setManufacturer("Alkem Laboratories Ltd");
            mTaxim.setCategory("Tablet");
            mTaxim.setDrugClass("Antibiotic");
            mTaxim.setUnit("Strip");
            mTaxim.setPackSize("10 Tablets/Strip");
            mTaxim.setHsnCode("3004");
            mTaxim.setTaxPercentage(new BigDecimal("12.0"));
            mTaxim.setMrp(new BigDecimal("112.00"));
            mTaxim.setPurchasePrice(new BigDecimal("82.00"));
            mTaxim.setSalePrice(new BigDecimal("104.00"));
            mTaxim.setSchedule("Schedule H1");
            mTaxim.setReorderLevel(15);
            mTaxim.setMedicineCode("IND-MED-120");
            mTaxim.setBarcode("8901234560120");
            medicineRepository.save(mTaxim);

            log.info("PharmacyDataSeeder: Seeded authentic Indian medicines.");
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
