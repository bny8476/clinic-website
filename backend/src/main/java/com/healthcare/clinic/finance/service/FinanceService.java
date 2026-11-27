package com.healthcare.clinic.finance.service;

import com.healthcare.clinic.finance.entity.Expense;
import com.healthcare.clinic.finance.entity.InsuranceClaim;
import com.healthcare.clinic.finance.entity.Payment;
import com.healthcare.clinic.finance.repository.ExpenseRepository;
import com.healthcare.clinic.finance.repository.InsuranceClaimRepository;
import com.healthcare.clinic.finance.repository.PaymentRepository;
import com.healthcare.clinic.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinanceService {

    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final InsuranceClaimRepository insuranceClaimRepository;
    private final com.healthcare.clinic.finance.repository.BranchBudgetRepository branchBudgetRepository;
    private final GeneralLedgerService generalLedgerService;

    @Transactional
    public Payment recordPayment(Payment payment) {
        Payment saved = paymentRepository.save(payment);
        
        // Automated GL Post
        generalLedgerService.postPaymentReceived(
            saved.getAmount(), 
            saved.getId(), // Cannot use invoiceId as it doesn't exist
            null, 
            saved.getRecordedBy()
        );
        
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Expense recordExpense(Expense expense) {
        if (expense.getStatus() == null) {
            expense.setStatus(com.healthcare.clinic.finance.entity.ExpenseStatus.PENDING_APPROVAL);
        }
        
        Expense savedExpense = expenseRepository.save(expense);
        return savedExpense;
    }

    @Transactional(readOnly = true)
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAllByOrderByIncurredOnDesc();
    }

    @Transactional
    public Expense approveExpense(Long expenseId, Long approverId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));
        if (expense.getStatus() != com.healthcare.clinic.finance.entity.ExpenseStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Only pending expenses can be approved (current status: " + expense.getStatus() + ")");
        }
        expense.setStatus(com.healthcare.clinic.finance.entity.ExpenseStatus.APPROVED);
        expense.setApprovedBy(approverId);
        expense.setApprovedAt(ZonedDateTime.now());
        
        // Update budget if applicable
        if (expense.getBranch() != null) {
            LocalDate incurred = expense.getIncurredOn();
            branchBudgetRepository.findByBranchIdAndBudgetYearAndBudgetMonth(
                    expense.getBranch().getId(), incurred.getYear(), incurred.getMonthValue())
                    .ifPresent(budget -> {
                        budget.setSpentAmount(budget.getSpentAmount().add(expense.getAmount()));
                        if (budget.getSpentAmount().compareTo(budget.getAllocatedAmount()) > 0) {
                            budget.setStatus("EXCEEDED");
                        }
                        branchBudgetRepository.save(budget);
                    });
        }
        
        return expenseRepository.save(expense);
    }

    @Transactional
    public Expense rejectExpense(Long expenseId, Long approverId, String reason) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));
        if (expense.getStatus() != com.healthcare.clinic.finance.entity.ExpenseStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Only pending expenses can be rejected (current status: " + expense.getStatus() + ")");
        }
        expense.setStatus(com.healthcare.clinic.finance.entity.ExpenseStatus.REJECTED);
        expense.setApprovedBy(approverId);
        expense.setApprovedAt(ZonedDateTime.now());
        expense.setRejectionReason(reason);
        return expenseRepository.save(expense);
    }
    
    @Transactional
    public Expense payExpense(Long expenseId, Long payerId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));
        if (expense.getStatus() != com.healthcare.clinic.finance.entity.ExpenseStatus.APPROVED) {
            throw new IllegalStateException("Only approved expenses can be paid (current status: " + expense.getStatus() + ")");
        }
        expense.setStatus(com.healthcare.clinic.finance.entity.ExpenseStatus.PAID);
        
        // Automated GL Post
        generalLedgerService.postExpensePaid(
            expense.getAmount(),
            expense.getId(),
            expense.getBranch() != null ? expense.getBranch().getId() : null,
            payerId,
            expense.getCategory()
        );
        
        return expenseRepository.save(expense);
    }

    @Transactional
    public InsuranceClaim submitClaim(InsuranceClaim claim) {
        return insuranceClaimRepository.save(claim);
    }

    @Transactional
    public InsuranceClaim updateClaimStatus(Long claimId, com.healthcare.clinic.finance.entity.ClaimStatus status) {
        InsuranceClaim claim = insuranceClaimRepository.findById(claimId).orElseThrow();
        claim.setStatus(status);
        if (com.healthcare.clinic.finance.entity.ClaimStatus.SETTLED.equals(status) || com.healthcare.clinic.finance.entity.ClaimStatus.APPROVED.equals(status)) {
            claim.setSettledAt(ZonedDateTime.now());
        }
        return insuranceClaimRepository.save(claim);
    }

    @Transactional(readOnly = true)
    public List<InsuranceClaim> getAllClaims() {
        return insuranceClaimRepository.findAllByOrderBySubmittedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getReceivablesOverview() {
        List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
        list.add(createReceivableItem("INV-2026-0891", "Patient: Rajesh Mehra", "Cardiology Inpatient Stent", new java.math.BigDecimal("48500.00"), "0-30 Days", "PENDING", "2026-12-05", "Cash / Self-Pay"));
        list.add(createReceivableItem("CLM-TPA-9021", "Star Health Insurance (TPA)", "ICU Surgical Admission Pre-Auth", new java.math.BigDecimal("125000.00"), "31-60 Days", "CLAIM_FILED", "2026-11-20", "Cashless Insurance"));
        list.add(createReceivableItem("INV-2026-0742", "Patient: Sunita Sharma", "MRI Brain & Contrast Panel", new java.math.BigDecimal("14200.00"), "0-30 Days", "PARTIAL", "2026-12-01", "UPI / Split Pay"));
        list.add(createReceivableItem("CLM-TPA-8843", "HDFC ERGO General Health", "Orthopedic Fracture Reduction", new java.math.BigDecimal("82000.00"), "61-90 Days", "ESCALATED", "2026-10-18", "TPA Settlement"));
        list.add(createReceivableItem("INV-2026-0610", "Patient: Vikram Patel", "Emergency Trauma & Suture", new java.math.BigDecimal("9500.00"), "90+ Days", "OVERDUE", "2026-09-15", "Credit Account"));
        list.add(createReceivableItem("CLM-CORP-401", "Tata Motors Corporate Health", "Executive Annual Health Check", new java.math.BigDecimal("35000.00"), "0-30 Days", "PENDING", "2026-12-10", "Corporate Credit"));
        return list;
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getPayablesOverview() {
        List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
        list.add(createPayableItem("VND-MED-01", "Medtronic India Pvt Ltd", "Cardiac Stents & Catheters", new java.math.BigDecimal("145000.00"), "2026-12-08", "DUE_SOON", "INV-MED-4421"));
        list.add(createPayableItem("VND-PHARM-04", "Sun Pharmaceutical Industries", "Antibiotics & Emergency Injectables", new java.math.BigDecimal("98000.00"), "2026-12-02", "DUE_SOON", "INV-SUN-9921"));
        list.add(createPayableItem("VND-LAB-09", "Roche Diagnostics India", "Biochemistry Reagents & Controls", new java.math.BigDecimal("62500.00"), "2026-12-15", "PENDING", "INV-RCH-810"));
        list.add(createPayableItem("VND-RAD-02", "GE Healthcare Ultrasound", "Ultrasound AMC & Transducer Service", new java.math.BigDecimal("45000.00"), "2026-11-25", "OVERDUE", "INV-GE-331"));
        list.add(createPayableItem("VND-UTIL-01", "Tata Power Institutional", "Hospital HT Electricity Substation", new java.math.BigDecimal("78500.00"), "2026-12-05", "DUE_SOON", "PWR-NOV-2026"));
        return list;
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getBankingOverview() {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        
        List<java.util.Map<String, Object>> accounts = new java.util.ArrayList<>();
        accounts.add(createBankAccount("HDFC Bank - Healthcare Operating A/C", "0029810004921", "HDFC0000298", new java.math.BigDecimal("2145000.00"), "ACTIVE", "Corporate Salary & Vendor Outflows"));
        accounts.add(createBankAccount("SBI - Clinical Revenue Collection A/C", "38100928174", "SBIN0004012", new java.math.BigDecimal("695000.00"), "ACTIVE", "UPI, POS Card & Patient Direct Credits"));
        accounts.add(createBankAccount("ICICI Bank - Escrow & Insurance Clearance", "10928374650", "ICIC0001092", new java.math.BigDecimal("480000.00"), "ACTIVE", "TPA & Cashless Pre-Auth Settlements"));
        map.put("bankAccounts", accounts);

        List<java.util.Map<String, Object>> cashDrawers = new java.util.ArrayList<>();
        cashDrawers.add(createCashDrawer("Main OPD Front Desk Cash Drawer", "Cashier: Priya Nair", new java.math.BigDecimal("145000.00"), "OPEN", "Active Shift"));
        cashDrawers.add(createCashDrawer("Pharmacy 24/7 Dispensing Register", "Cashier: Ramesh Kumar", new java.math.BigDecimal("120000.00"), "OPEN", "Active Shift"));
        cashDrawers.add(createCashDrawer("Emergency Trauma Counter Register", "Cashier: Anita Joshi", new java.math.BigDecimal("50000.00"), "OPEN", "Active Shift"));
        map.put("cashDrawers", cashDrawers);

        map.put("reconciliationSummary", java.util.Map.of(
            "matchedCount", 248,
            "pendingCount", 12,
            "discrepancyCount", 1,
            "lastReconciledAt", java.time.LocalDate.now().toString()
        ));

        return map;
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getChartOfAccountsOverview() {
        List<java.util.Map<String, Object>> accounts = new java.util.ArrayList<>();
        // ASSETS (1000s)
        accounts.add(createCOAItem("1010", "Cash in Hand (Drawers)", "ASSET", new java.math.BigDecimal("315000.00"), "Current Asset"));
        accounts.add(createCOAItem("1020", "HDFC Operating Bank A/C", "ASSET", new java.math.BigDecimal("2145000.00"), "Current Asset"));
        accounts.add(createCOAItem("1030", "SBI Revenue Collection A/C", "ASSET", new java.math.BigDecimal("695000.00"), "Current Asset"));
        accounts.add(createCOAItem("1100", "Accounts Receivable - Patients", "ASSET", new java.math.BigDecimal("425000.00"), "Current Asset"));
        accounts.add(createCOAItem("1110", "Accounts Receivable - TPA Insurance", "ASSET", new java.math.BigDecimal("420000.00"), "Current Asset"));
        accounts.add(createCOAItem("1200", "Pharmacy & Medicine Inventory", "ASSET", new java.math.BigDecimal("850000.00"), "Inventory Asset"));
        accounts.add(createCOAItem("1500", "Hospital Diagnostic & OT Equipment", "ASSET", new java.math.BigDecimal("6200000.00"), "Fixed Asset"));

        // LIABILITIES (2000s)
        accounts.add(createCOAItem("2010", "Accounts Payable - Medical Vendors", "LIABILITY", new java.math.BigDecimal("380000.00"), "Current Liability"));
        accounts.add(createCOAItem("2020", "Salaries & Payroll Payable", "LIABILITY", new java.math.BigDecimal("685000.00"), "Current Liability"));
        accounts.add(createCOAItem("2030", "Statutory Dues (PF, ESI, TDS Payable)", "LIABILITY", new java.math.BigDecimal("145000.00"), "Current Liability"));
        accounts.add(createCOAItem("2040", "Patient Advances & Deposits", "LIABILITY", new java.math.BigDecimal("95000.00"), "Current Liability"));

        // EQUITY (3000s)
        accounts.add(createCOAItem("3010", "Hospital Capital & Reserves", "EQUITY", new java.math.BigDecimal("5500000.00"), "Equity"));
        accounts.add(createCOAItem("3020", "Retained Clinical Earnings", "EQUITY", new java.math.BigDecimal("1850000.00"), "Equity"));

        // REVENUE (4000s)
        accounts.add(createCOAItem("4010", "Patient Consultation & OPD Revenue", "REVENUE", new java.math.BigDecimal("450000.00"), "Operating Revenue"));
        accounts.add(createCOAItem("4020", "Pharmacy Dispensing Revenue", "REVENUE", new java.math.BigDecimal("1640000.00"), "Operating Revenue"));
        accounts.add(createCOAItem("4030", "Laboratory Diagnostic Revenue", "REVENUE", new java.math.BigDecimal("965000.00"), "Operating Revenue"));
        accounts.add(createCOAItem("4040", "Radiology & Imaging Revenue", "REVENUE", new java.math.BigDecimal("820000.00"), "Operating Revenue"));
        accounts.add(createCOAItem("4050", "Inpatient & Surgical OT Revenue", "REVENUE", new java.math.BigDecimal("95000.00"), "Operating Revenue"));

        // EXPENSES (5000s)
        accounts.add(createCOAItem("5010", "Clinical & Medical Supplies Expense", "EXPENSE", new java.math.BigDecimal("540000.00"), "Direct Expense"));
        accounts.add(createCOAItem("5020", "Staff Salaries & Nursing Remuneration", "EXPENSE", new java.math.BigDecimal("1680000.00"), "Staff Expense"));
        accounts.add(createCOAItem("5030", "Hospital Utilities & Electricity", "EXPENSE", new java.math.BigDecimal("125000.00"), "Operating Expense"));
        accounts.add(createCOAItem("5040", "Equipment Maintenance & AMC", "EXPENSE", new java.math.BigDecimal("95000.00"), "Operating Expense"));
        accounts.add(createCOAItem("5050", "Rent & Facility Lease", "EXPENSE", new java.math.BigDecimal("180000.00"), "Fixed Expense"));

        return accounts;
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getPayrollSummaryOverview() {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("totalSalaryExpense", new java.math.BigDecimal("1680000.00"));
        map.put("grossSalary", new java.math.BigDecimal("1825000.00"));
        map.put("statutoryDeductions", new java.math.BigDecimal("145000.00"));
        map.put("netDisbursed", new java.math.BigDecimal("1680000.00"));
        map.put("payrollLiability", new java.math.BigDecimal("685000.00"));
        map.put("activeStaffCount", 48);
        map.put("status", "HR_PROCESSED_PENDING_DISBURSEMENT");
        
        List<java.util.Map<String, Object>> deptCosts = List.of(
            java.util.Map.of("department", "Emergency & Trauma", "cost", 420000.0, "headcount", 10),
            java.util.Map.of("department", "Inpatient & ICU Nursing", "cost", 380000.0, "headcount", 14),
            java.util.Map.of("department", "Cardiology Specialists", "cost", 350000.0, "headcount", 4),
            java.util.Map.of("department", "Pharmacy Operations", "cost", 190000.0, "headcount", 8),
            java.util.Map.of("department", "Diagnostic Pathology", "cost", 160000.0, "headcount", 6),
            java.util.Map.of("department", "Administration & HR", "cost", 180000.0, "headcount", 6)
        );
        map.put("departmentPayrollCosts", deptCosts);
        return map;
    }

    private java.util.Map<String, Object> createReceivableItem(String inv, String patient, String service, java.math.BigDecimal amt, String aging, String status, String due, String mode) {
        return java.util.Map.of(
            "invoiceNumber", inv,
            "payerName", patient,
            "serviceDescription", service,
            "amount", amt,
            "agingBracket", aging,
            "status", status,
            "dueDate", due,
            "billingMode", mode
        );
    }

    private java.util.Map<String, Object> createPayableItem(String code, String vendor, String desc, java.math.BigDecimal amt, String due, String status, String billNo) {
        return java.util.Map.of(
            "vendorCode", code,
            "vendorName", vendor,
            "description", desc,
            "amount", amt,
            "dueDate", due,
            "status", status,
            "billNumber", billNo
        );
    }

    private java.util.Map<String, Object> createBankAccount(String name, String acc, String ifsc, java.math.BigDecimal bal, String st, String purpose) {
        return java.util.Map.of(
            "accountName", name,
            "accountNumber", acc,
            "ifscCode", ifsc,
            "balance", bal,
            "status", st,
            "purpose", purpose
        );
    }

    private java.util.Map<String, Object> createCashDrawer(String name, String cashier, java.math.BigDecimal bal, String st, String shift) {
        return java.util.Map.of(
            "drawerName", name,
            "cashierName", cashier,
            "balance", bal,
            "status", st,
            "shift", shift
        );
    }

    private java.util.Map<String, Object> createCOAItem(String code, String name, String type, java.math.BigDecimal bal, String cat) {
        return java.util.Map.of(
            "accountCode", code,
            "accountName", name,
            "accountType", type,
            "balance", bal,
            "category", cat
        );
    }
}
