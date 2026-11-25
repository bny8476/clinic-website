package com.healthcare.clinic.finance;

import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.finance.entity.CashierSession;
import com.healthcare.clinic.finance.repository.CashierSessionRepository;
import com.healthcare.clinic.finance.service.CashierService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class CashierSessionTest {

    @Autowired
    private CashierService cashierService;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private CashierSessionRepository cashierSessionRepository;

    @Test
    public void testOpenCashierSession() {
        Branch branch = branchRepository.findAll().stream().findFirst().orElseGet(() -> {
            Branch b = Branch.builder()
                    .name("Test Branch")
                    .address("123 Test St")
                    .city("Test City")
                    .state("TS")
                    .country("Country")
                    .postalCode("123456")
                    .timezone("UTC")
                    .isActive(true)
                    .build();
            return branchRepository.save(b);
        });

        CashierSession session = cashierService.openSession(branch.getId(), 9999L, new BigDecimal("250.00"));
        assertNotNull(session);
        assertNotNull(session.getId());
        assertEquals(CashierSession.SessionStatus.OPEN, session.getStatus());
        assertEquals(new BigDecimal("250.00"), session.getOpeningFloat());
    }
}
