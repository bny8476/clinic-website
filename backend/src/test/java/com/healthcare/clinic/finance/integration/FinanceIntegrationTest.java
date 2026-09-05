package com.healthcare.clinic.finance.integration;

import com.healthcare.clinic.finance.entity.Expense;
import com.healthcare.clinic.finance.entity.JournalEntry;
import com.healthcare.clinic.finance.entity.Payment;
import com.healthcare.clinic.finance.service.FinanceService;
import com.healthcare.clinic.finance.service.GeneralLedgerService;
import com.healthcare.clinic.finance.entity.ChartOfAccount;
import com.healthcare.clinic.finance.repository.ChartOfAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
public class FinanceIntegrationTest {

    @Autowired
    private FinanceService financeService;

    @Autowired
    private GeneralLedgerService generalLedgerService;

    @Autowired
    private ChartOfAccountRepository chartOfAccountRepository;

    @BeforeEach
    public void setupAccounts() {
        if (chartOfAccountRepository.findByAccountCode("1001").isEmpty()) {
            chartOfAccountRepository.save(ChartOfAccount.builder()
                    .accountCode("1001")
                    .accountName("Cash")
                    .accountType(ChartOfAccount.AccountType.ASSET)
                    .isActive(true)
                    .build());
        }
        if (chartOfAccountRepository.findByAccountCode("5000").isEmpty()) {
            chartOfAccountRepository.save(ChartOfAccount.builder()
                    .accountCode("5000")
                    .accountName("General Expense")
                    .accountType(ChartOfAccount.AccountType.EXPENSE)
                    .isActive(true)
                    .build());
        }
    }

    @Test
    public void testExpenseLifecycleAndGLPosting() {
        // Create an Expense
        Expense expense = new Expense();
        expense.setCategory("MAINTENANCE");
        expense.setDescription("AC Repair");
        expense.setAmount(new BigDecimal("5000.00"));
        expense.setIncurredOn(LocalDate.now());

        Expense savedExpense = financeService.recordExpense(expense);
        assertNotNull(savedExpense.getId());
        assertEquals(com.healthcare.clinic.finance.entity.ExpenseStatus.PENDING_APPROVAL, savedExpense.getStatus());

        // Approve the Expense
        Expense approvedExpense = financeService.approveExpense(savedExpense.getId(), 1L);
        assertEquals(com.healthcare.clinic.finance.entity.ExpenseStatus.APPROVED, approvedExpense.getStatus());

        // Pay the Expense
        Expense paidExpense = financeService.payExpense(approvedExpense.getId(), 1L);
        assertEquals(com.healthcare.clinic.finance.entity.ExpenseStatus.PAID, paidExpense.getStatus());

        // Verify Journal Entry was created
        var journals = generalLedgerService.getAllJournals();
        boolean found = journals.stream().anyMatch(j -> 
            "EXPENSE".equals(j.getReferenceType()) && 
            paidExpense.getId().equals(j.getReferenceId())
        );
        assertThat(found).isTrue();
    }
}
