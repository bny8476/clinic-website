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
}
