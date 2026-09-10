package com.healthcare.clinic.config;

import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.laboratory.entity.*;
import com.healthcare.clinic.laboratory.repository.*;
import com.healthcare.clinic.notification.entity.Notification;
import com.healthcare.clinic.notification.repository.NotificationRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class LabDataSeeder implements CommandLineRunner {

    private final LabTestCatalogRepository catalogRepository;
    private final LabTestRequestRepository requestRepository;
    private final LabResultRepository resultRepository;
    private final LabBarcodeRepository barcodeRepository;
    private final LabInventoryItemRepository inventoryRepository;
    private final LabQualityControlRepository qcRepository;
    private final NotificationRepository notificationRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        try {
            log.info("LabDataSeeder: Checking laboratory sample data...");
            seedLabData();
        } catch (Exception e) {
            log.warn("LabDataSeeder: Non-fatal exception during lab data seeding: {}", e.getMessage(), e);
        }
    }

    private void seedLabData() {
        Branch branch = branchRepository.findById(1L).orElse(null);
        User labTech = userRepository.findByEmail("labtech@clinic.com").orElse(null);
        User admin = userRepository.findByEmail("admin@clinic.com").orElse(null);

        // 1. Seed Lab Test Catalog if missing or incomplete
        List<LabTestCatalog> seededCatalogs = seedTestCatalog(branch);

        // 2. Seed Lab Inventory Items
        seedInventory(branch);

        // 3. Seed Lab Quality Control
        seedQualityControl(seededCatalogs, labTech, branch);

        // 4. Seed Lab Requests & Results if request count is small (< 8)
        if (requestRepository.count() < 8) {
            seedLabRequestsAndResults(seededCatalogs, labTech, admin, branch);
        }

        // 5. Seed Lab Notifications for lab tech
        if (labTech != null) {
            seedNotifications(labTech);
        }

        log.info("LabDataSeeder: Successfully completed laboratory sample data seeding.");
    }

    private List<LabTestCatalog> seedTestCatalog(Branch branch) {
        List<LabTestCatalog> catalogs = new ArrayList<>();

        catalogs.add(createOrUpdateCatalog("LAB-CBC", "Complete Blood Count (CBC) with Differential",
                "Includes WBC, RBC, Hemoglobin, Hematocrit, Platelets, and Differential.",
                new BigDecimal("25.00"), "4.5 - 11.0", "10^3/µL", "Hematology", "Whole Blood", "EDTA Purple Top", 2, "Automated Hematology Analyzer", branch));

        catalogs.add(createOrUpdateCatalog("LAB-LIPID", "Comprehensive Lipid Profile",
                "Measures Total Cholesterol, HDL, LDL, VLDL, and Triglycerides.",
                new BigDecimal("45.00"), "< 200", "mg/dL", "Biochemistry", "Serum", "SST Gold Top", 4, "Enzymatic Colorimetric Assay", branch));

        catalogs.add(createOrUpdateCatalog("LAB-LFT", "Liver Function Panel (LFT)",
                "ALT, AST, ALP, Total Bilirubin, Direct Bilirubin, Total Protein, Albumin.",
                new BigDecimal("50.00"), "7 - 56", "U/L", "Biochemistry", "Serum", "SST Gold Top", 3, "Spectrophotometry", branch));

        catalogs.add(createOrUpdateCatalog("LAB-KFT", "Renal Function Panel (Kidney Profile)",
                "Serum Creatinine, Blood Urea Nitrogen (BUN), eGFR, Uric Acid.",
                new BigDecimal("40.00"), "0.7 - 1.3", "mg/dL", "Biochemistry", "Serum", "SST Gold Top", 3, "Jaffe Kinetic Assay", branch));

        catalogs.add(createOrUpdateCatalog("LAB-HBA1C", "Glycated Hemoglobin (HbA1c)",
                "Gold standard test for 3-month glycemic control assessment.",
                new BigDecimal("35.00"), "< 5.7", "%", "Biochemistry", "Whole Blood", "EDTA Purple Top", 2, "HPLC Method", branch));

        catalogs.add(createOrUpdateCatalog("LAB-TFT", "Thyroid Function Panel (T3, T4, TSH)",
                "Quantitative measurement of Total T3, Free T4, and Ultra-Sensitive TSH.",
                new BigDecimal("65.00"), "0.4 - 4.0", "mIU/L", "Endocrinology", "Serum", "SST Gold Top", 6, "Chemiluminescence Immunoassay (CLIA)", branch));

        catalogs.add(createOrUpdateCatalog("LAB-TROP", "High-Sensitivity Cardiac Troponin-I",
                "Urgent biomarker for myocardial infarction and acute coronary syndrome.",
                new BigDecimal("80.00"), "< 0.04", "ng/mL", "Cardiac / Emergency", "Plasma", "Lithium Heparin Green Top", 1, "Fluorescence Immunoassay", branch));

        catalogs.add(createOrUpdateCatalog("LAB-URINE-RT", "Routine Urinalysis & Microscopy",
                "Physical, chemical (10-parameter strip), and microscopic sediment examination.",
                new BigDecimal("20.00"), "Normal", "", "Pathology", "Urine", "Sterile Specimen Container", 1, "Automated Strip & Microscopy", branch));

        catalogs.add(createOrUpdateCatalog("LAB-PCR", "COVID-19 & Flu A/B RT-PCR Assay",
                "Multiplex real-time RT-PCR for viral RNA detection.",
                new BigDecimal("90.00"), "Negative", "", "Molecular Diagnostics", "Nasopharyngeal Swab", "Viral Transport Medium (VTM)", 4, "Real-Time RT-PCR", branch));

        catalogs.add(createOrUpdateCatalog("LAB-VITD", "25-Hydroxy Vitamin D Total",
                "Quantification of D2 and D3 serum levels for bone and immune health.",
                new BigDecimal("55.00"), "30 - 100", "ng/mL", "Endocrinology", "Serum", "SST Gold Top", 12, "LC-MS/MS", branch));

        catalogs.add(createOrUpdateCatalog("LAB-ELEC", "Serum Electrolyte Panel (Na+, K+, Cl-, HCO3-)",
                "Measures essential serum electrolyte balance.",
                new BigDecimal("30.00"), "135 - 145", "mEq/L", "Biochemistry", "Serum", "SST Gold Top", 1, "Ion Selective Electrode (ISE)", branch));

        return catalogs;
    }

    private LabTestCatalog createOrUpdateCatalog(String code, String name, String desc, BigDecimal price,
                                                  String refRange, String unit, String category,
                                                  String specimen, String container, int tat, String method, Branch branch) {
        LabTestCatalog item = catalogRepository.findByTestCode(code).orElseGet(() ->
                LabTestCatalog.builder().testCode(code).build()
        );

        item.setTestName(name);
        item.setDescription(desc);
        item.setPrice(price);
        item.setReferenceRange(refRange);
        item.setUnit(unit);
        item.setCategory(category);
        item.setDepartment(category);
        item.setSpecimenType(specimen);
        item.setContainerType(container);
        item.setTurnaroundTargetHours(tat);
        item.setMethod(method);
        item.setIsActive(true);
        item.setInsuranceEligible(true);
        item.setBranch(branch);

        return catalogRepository.save(item);
    }

    private void seedInventory(Branch branch) {
        createOrUpdateInventory("INV-EDTA-001", "Vacutainer EDTA 4mL Blood Collection Tubes", 250, 50, "pcs", branch);
        createOrUpdateInventory("INV-SST-002", "Vacutainer SST Gel Separator Tubes 5mL", 300, 60, "pcs", branch);
        createOrUpdateInventory("INV-LIP-REAG", "Lipid Profile Analyzer Reagent Cartridge", 18, 10, "kits", branch);
        createOrUpdateInventory("INV-CBC-LYSE", "Hematology Analyzer Cell Lyse Solution 5L", 8, 5, "L", branch);
        createOrUpdateInventory("INV-PCR-KIT", "RT-PCR Amplification Mastermix Kit (100 rxns)", 4, 5, "kits", branch); // Low stock trigger
        createOrUpdateInventory("INV-URINE-STRIP", "10-Parameter Urine Test Strips (100 strips/box)", 120, 30, "boxes", branch);
    }

    private void createOrUpdateInventory(String sku, String name, int qty, int minThreshold, String unit, Branch branch) {
        LabInventoryItem item = inventoryRepository.findBySku(sku).orElseGet(() ->
                LabInventoryItem.builder().sku(sku).build()
        );
        item.setItemName(name);
        item.setQuantity(qty);
        item.setMinimumThreshold(minThreshold);
        item.setUnit(unit);
        item.setBranch(branch);
        inventoryRepository.save(item);
    }

    private void seedQualityControl(List<LabTestCatalog> catalogs, User labTech, Branch branch) {
        if (catalogs.isEmpty() || labTech == null) return;

        for (int i = 0; i < Math.min(3, catalogs.size()); i++) {
            LabTestCatalog catalog = catalogs.get(i);
            if (qcRepository.findByTestCatalogIdOrderByPerformedAtDesc(catalog.getId()).isEmpty()) {
                LabQualityControl qc = LabQualityControl.builder()
                        .testCatalog(catalog)
                        .status(i == 1 ? "WARNING" : "PASSED")
                        .notes(i == 1 ? "Control level 2 slightly elevated (+1.2 SD), recalibration recommended." : "Daily QC passed within ±1 SD control limits.")
                        .performedBy(labTech)
                        .branch(branch)
                        .build();
                qcRepository.save(qc);
            }
        }
    }

    private void seedLabRequestsAndResults(List<LabTestCatalog> catalogs, User labTech, User admin, Branch branch) {
        List<PatientProfile> patients = patientProfileRepository.findAll();
        List<DoctorProfile> doctors = doctorProfileRepository.findAll();

        if (patients.isEmpty() || catalogs.isEmpty()) return;

        PatientProfile john = patients.stream().filter(p -> "MRN-2026-001".equals(p.getOpNumber())).findFirst().orElse(patients.get(0));
        PatientProfile sarah = patients.size() > 1 ? patients.get(1) : john;
        PatientProfile michael = patients.size() > 2 ? patients.get(2) : john;

        DoctorProfile doctor = doctors.isEmpty() ? null : doctors.get(0);
        ZonedDateTime now = ZonedDateTime.now();

        LabTestCatalog cbc = findCatalogByCode(catalogs, "LAB-CBC");
        LabTestCatalog lipid = findCatalogByCode(catalogs, "LAB-LIPID");
        LabTestCatalog lft = findCatalogByCode(catalogs, "LAB-LFT");
        LabTestCatalog hba1c = findCatalogByCode(catalogs, "LAB-HBA1C");
        LabTestCatalog troponin = findCatalogByCode(catalogs, "LAB-TROP");
        LabTestCatalog urine = findCatalogByCode(catalogs, "LAB-URINE-RT");
        LabTestCatalog pcr = findCatalogByCode(catalogs, "LAB-PCR");
        LabTestCatalog tft = findCatalogByCode(catalogs, "LAB-TFT");

        // 1. REQUESTED status (New request awaiting sample)
        createRequest(john, doctor, cbc, "REQUESTED", "ROUTINE", "LAB-2026-101", null, now.minusHours(1), null, null, null, branch);
        createRequest(sarah, doctor, troponin, "REQUESTED", "STAT", "LAB-2026-102", null, now.minusMinutes(30), null, null, null, branch);

        // 2. SAMPLE_COLLECTED status
        createRequest(michael, doctor, lipid, "SAMPLE_COLLECTED", "URGENT", "LAB-2026-103", "BAR-2026-1003", now.minusHours(3), now.minusHours(2), null, null, branch);
        createRequest(john, doctor, urine, "SAMPLE_COLLECTED", "ROUTINE", "LAB-2026-104", "BAR-2026-1004", now.minusHours(4), now.minusHours(3), null, null, branch);

        // 3. IN_PROGRESS / RECEIVED status
        createRequest(sarah, doctor, lft, "IN_PROGRESS", "URGENT", "LAB-2026-105", "BAR-2026-1005", now.minusHours(5), now.minusHours(4), null, null, branch);

        // 4. RESULT_ENTERED status (Ready for Report Verification!)
        LabTestRequest reqResult1 = createRequest(michael, doctor, hba1c, "RESULT_ENTERED", "ROUTINE", "LAB-2026-106", "BAR-2026-1006", now.minusHours(6), now.minusHours(5), labTech, null, branch);
        createResult(reqResult1, labTech, "7.8", "< 5.7", "%", true, false, false, now.minusHours(1), "Elevated HbA1c indicative of poorly controlled Type 2 Diabetes Mellitus.");

        LabTestRequest reqResult2 = createRequest(john, doctor, troponin, "RESULT_ENTERED", "STAT", "LAB-2026-107", "BAR-2026-1007", now.minusHours(2), now.minusHours(1), labTech, null, branch);
        createResult(reqResult2, labTech, "3.45", "< 0.04", "ng/mL", true, true, false, now.minusMinutes(40), "CRITICAL ALERT: Markedly elevated cardiac troponin-I. Urgent cardiology review advised.");

        LabTestRequest reqResult3 = createRequest(sarah, doctor, tft, "RESULT_ENTERED", "ROUTINE", "LAB-2026-108", "BAR-2026-1008", now.minusHours(7), now.minusHours(6), labTech, null, branch);
        createResult(reqResult3, labTech, "2.1", "0.4 - 4.0", "mIU/L", false, false, false, now.minusHours(2), "Euthyroid pattern within normal reference range.");

        // 5. PENDING_VERIFICATION status
        LabTestRequest reqVerify1 = createRequest(john, doctor, lipid, "PENDING_VERIFICATION", "ROUTINE", "LAB-2026-109", "BAR-2026-1009", now.minusHours(8), now.minusHours(7), labTech, null, branch);
        createResult(reqVerify1, labTech, "Total Cholesterol: 245 mg/dL, HDL: 42 mg/dL, LDL: 161 mg/dL, Triglycerides: 210 mg/dL", "< 200", "mg/dL", true, false, false, now.minusHours(3), "Hypercholesterolemia with elevated LDL.");

        // 6. VERIFIED / RELEASED / COMPLETED status
        LabTestRequest reqCompleted1 = createRequest(john, doctor, cbc, "RELEASED", "ROUTINE", "LAB-2026-110", "BAR-2026-1010", now.minusDays(1), now.minusDays(1).plusHours(1), labTech, admin, branch);
        reqCompleted1.setReleasedAt(now.minusDays(1).plusHours(3));
        reqCompleted1.setAcknowledgedAt(now.minusDays(1).plusHours(4));
        reqCompleted1.setAcknowledgedBy(admin);
        requestRepository.save(reqCompleted1);
        createVerifiedResult(reqCompleted1, labTech, "WBC: 6.8 10^3/µL, RBC: 4.85 10^6/µL, Hemoglobin: 14.5 g/dL, Hematocrit: 43.2%, Platelets: 265 10^3/µL", "4.5 - 11.0", "10^3/µL", false, false, admin, now.minusDays(1).plusHours(2), "All cell lines within normal limits.");

        LabTestRequest reqCompleted2 = createRequest(sarah, doctor, pcr, "VERIFIED", "ROUTINE", "LAB-2026-111", "BAR-2026-1011", now.minusDays(2), now.minusDays(2).plusHours(1), labTech, admin, branch);
        createVerifiedResult(reqCompleted2, labTech, "Negative for SARS-CoV-2 RNA", "Negative", "", false, false, admin, now.minusDays(2).plusHours(3), "No target viral RNA detected.");
    }

    private LabTestRequest createRequest(PatientProfile patient, DoctorProfile doctor, LabTestCatalog catalog,
                                         String status, String priority, String reqNumber, String barcode,
                                         ZonedDateTime reqAt, ZonedDateTime collectedAt, User labTech, User verifier, Branch branch) {
        LabTestRequest req = requestRepository.findByLabRequestNumber(reqNumber).orElseGet(() ->
                LabTestRequest.builder().labRequestNumber(reqNumber).build()
        );

        req.setPatient(patient);
        req.setDoctor(doctor);
        req.setTestCatalog(catalog);
        req.setStatus(status);
        req.setPriority(priority);
        req.setSampleBarcodeId(barcode);
        req.setRequestedAt(reqAt);
        req.setSampleCollectedAt(collectedAt);
        req.setAcceptedBy(labTech);
        req.setBranch(branch);

        LabTestRequest saved = requestRepository.save(req);

        // Generate barcode record if barcode string is present
        if (barcode != null && barcodeRepository.findByBarcodeValue(barcode).isEmpty()) {
            LabBarcode b = LabBarcode.builder()
                    .barcodeValue(barcode)
                    .patient(patient)
                    .labRequestNumber(reqNumber)
                    .specimenType(catalog.getSpecimenType() != null ? catalog.getSpecimenType() : "Blood")
                    .containerType(catalog.getContainerType() != null ? catalog.getContainerType() : "Tubes")
                    .status("PRINTED")
                    .generatedBy(labTech)
                    .build();
            barcodeRepository.save(b);
        }

        return saved;
    }

    private void createResult(LabTestRequest request, User labTech, String val, String refRange, String unit,
                              boolean abnormal, boolean critical, boolean draft, ZonedDateTime enteredAt, String comments) {
        LabResult res = resultRepository.findByRequestId(request.getId()).orElseGet(() ->
                LabResult.builder().request(request).build()
        );

        res.setLabTech(labTech);
        res.setResultValue(val);
        res.setReferenceRange(refRange);
        res.setUnit(unit);
        res.setIsAbnormal(abnormal);
        res.setIsCritical(critical);
        res.setIsDraft(draft);
        res.setEnteredAt(enteredAt);
        res.setPathologistComments(comments);

        resultRepository.save(res);
    }

    private void createVerifiedResult(LabTestRequest request, User labTech, String val, String refRange, String unit,
                                      boolean abnormal, boolean critical, User verifier, ZonedDateTime verifiedAt, String comments) {
        LabResult res = resultRepository.findByRequestId(request.getId()).orElseGet(() ->
                LabResult.builder().request(request).build()
        );

        res.setLabTech(labTech);
        res.setResultValue(val);
        res.setReferenceRange(refRange);
        res.setUnit(unit);
        res.setIsAbnormal(abnormal);
        res.setIsCritical(critical);
        res.setIsDraft(false);
        res.setVerifiedBy(verifier);
        res.setVerifiedAt(verifiedAt);
        res.setPathologistComments(comments);

        resultRepository.save(res);
    }

    private LabTestCatalog findCatalogByCode(List<LabTestCatalog> catalogs, String code) {
        return catalogs.stream()
                .filter(c -> code.equals(c.getTestCode()))
                .findFirst()
                .orElse(catalogs.get(0));
    }

    private void seedNotifications(User labTech) {
        createNotification(labTech, "CRITICAL RESULT ALERT", "Patient John Smith has critical High Troponin-I value (3.45 ng/mL). Immediate notification required.", "ALERT");
        createNotification(labTech, "STAT REQUEST RECEIVED", "Emergency Department ordered STAT Troponin-I test for Sarah Jenkins.", "INFO");
        createNotification(labTech, "REAGENT LOW STOCK", "RT-PCR Amplification Mastermix Kit is below minimum threshold (4 remaining).", "WARNING");
        createNotification(labTech, "NEW LAB REQUEST", "Fasting Blood Glucose & HbA1c requested for Michael Chang.", "INFO");
    }

    private void createNotification(User recipient, String title, String message, String type) {
        if (recipient == null || recipient.getId() == null) return;
        Notification n = Notification.builder()
                .userId(recipient.getId())
                .title(title)
                .body(message)
                .type(type)
                .isRead(false)
                .createdAt(ZonedDateTime.now())
                .build();
        notificationRepository.save(n);
    }
}
