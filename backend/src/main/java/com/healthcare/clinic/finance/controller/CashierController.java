package com.healthcare.clinic.finance.controller;

import com.healthcare.clinic.finance.entity.CashierSession;
import com.healthcare.clinic.finance.service.CashierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/finance/cashier")
@RequiredArgsConstructor
public class CashierController {

    private final CashierService cashierService;

    @GetMapping("/sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPER_ADMIN')")
    public ResponseEntity<java.util.List<CashierSession>> getSessions() {
        return ResponseEntity.ok(cashierService.getAllSessions());
    }

    @GetMapping("/session/current")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPER_ADMIN', 'CASHIER', 'RECEPTIONIST')")
    public ResponseEntity<CashierSession> getCurrentSession(@RequestParam Long cashierId) {
        return cashierService.getCurrentSession(cashierId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/session/open")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPER_ADMIN', 'CASHIER', 'RECEPTIONIST')")
    public ResponseEntity<CashierSession> openSession(@RequestBody Map<String, Object> request) {
        Object branchIdObj = request.get("branchId");
        Long branchId = (branchIdObj != null && !branchIdObj.toString().trim().isEmpty())
                ? Long.valueOf(branchIdObj.toString().trim())
                : 1L;

        Object cashierIdObj = request.get("cashierId");
        Long cashierId = (cashierIdObj != null && !cashierIdObj.toString().trim().isEmpty())
                ? Long.valueOf(cashierIdObj.toString().trim())
                : 1L;

        Object openingFloatObj = request.get("openingFloat");
        BigDecimal openingFloat = (openingFloatObj != null && !openingFloatObj.toString().trim().isEmpty())
                ? new BigDecimal(openingFloatObj.toString().trim())
                : BigDecimal.ZERO;

        CashierSession session = cashierService.openSession(branchId, cashierId, openingFloat);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/session/{sessionId}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'ACCOUNTANT', 'SUPER_ADMIN', 'CASHIER', 'RECEPTIONIST')")
    public ResponseEntity<CashierSession> closeSession(
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> request) {
        
        BigDecimal closingFloat = new BigDecimal(request.get("closingFloat").toString());
        CashierSession session = cashierService.closeSession(sessionId, closingFloat);
        return ResponseEntity.ok(session);
    }
}
