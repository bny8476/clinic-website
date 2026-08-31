package com.healthcare.clinic.finance.controller;

import com.healthcare.clinic.finance.entity.Expense;
import com.healthcare.clinic.finance.entity.InsuranceClaim;
import com.healthcare.clinic.finance.entity.Payment;
import com.healthcare.clinic.finance.service.FinanceService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FINANCE') or hasRole('ACCOUNTANT') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
public class FinanceController {

    private final FinanceService financeService;
    private final com.healthcare.clinic.finance.service.DashboardService dashboardService;

    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getPayments() {
        return ResponseEntity.ok(financeService.getAllPayments());
    }


    @GetMapping("/expenses")
    public ResponseEntity<List<Expense>> getExpenses() {
        return ResponseEntity.ok(financeService.getAllExpenses());
    }

    @PostMapping("/expenses")
    public ResponseEntity<Expense> recordExpense(@RequestBody Expense expense, @AuthenticationPrincipal UserPrincipal user) {
        expense.setRecordedBy(user.getUserId());
        return ResponseEntity.ok(financeService.recordExpense(expense));
    }

    @PostMapping("/expenses/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('ACCOUNTANT')")
    public ResponseEntity<Expense> approveExpense(@PathVariable Long id, @RequestParam Long approverId) {
        return ResponseEntity.ok(financeService.approveExpense(id, approverId));
    }

    @PostMapping("/expenses/{id}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('ACCOUNTANT')")
    public ResponseEntity<Expense> rejectExpense(
            @PathVariable Long id, 
            @RequestParam Long approverId,
            @RequestBody java.util.Map<String, String> request) {
        return ResponseEntity.ok(financeService.rejectExpense(id, approverId, request.get("reason")));
    }
    
    @PostMapping("/expenses/{id}/pay")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('ACCOUNTANT')")
    public ResponseEntity<Expense> payExpense(@PathVariable Long id, @RequestParam Long payerId) {
        return ResponseEntity.ok(financeService.payExpense(id, payerId));
    }

    @GetMapping("/claims")
    public ResponseEntity<List<InsuranceClaim>> getClaims() {
        return ResponseEntity.ok(financeService.getAllClaims());
    }

    @PostMapping("/claims")
    public ResponseEntity<InsuranceClaim> submitClaim(@RequestBody InsuranceClaim claim) {
        return ResponseEntity.ok(financeService.submitClaim(claim));
    }

    @PatchMapping("/claims/{id}/status")
    public ResponseEntity<InsuranceClaim> updateClaimStatus(@PathVariable Long id, @RequestParam com.healthcare.clinic.finance.entity.ClaimStatus status) {
        return ResponseEntity.ok(financeService.updateClaimStatus(id, status));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('ACCOUNTANT')")
    public ResponseEntity<com.healthcare.clinic.finance.dto.DashboardResponse> getDashboardData(
            @RequestParam(required = false) Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getRealtimeDashboardData(branchId, startDate, endDate));
    }
}
