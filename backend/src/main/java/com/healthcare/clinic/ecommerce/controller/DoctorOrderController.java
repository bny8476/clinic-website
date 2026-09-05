package com.healthcare.clinic.ecommerce.controller;

import com.healthcare.clinic.ecommerce.entity.EcommerceOrder;
import com.healthcare.clinic.ecommerce.service.DoctorOrderService;
import com.healthcare.clinic.security.SecurityUtils;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'PHARMACIST')")
public class DoctorOrderController {

    private final DoctorOrderService doctorOrderService;

    @GetMapping
    public ResponseEntity<List<EcommerceOrder>> getDoctorOrders(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) String status) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(doctorOrderService.getDoctorOrders(userId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EcommerceOrder> getOrderDetails(@PathVariable Long id) {
        return ResponseEntity.ok(doctorOrderService.getOrderDetails(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<EcommerceOrder> updateOrderStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) Map<String, String> payload) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        String targetStatus = status;
        String note = null;
        if (payload != null) {
            if (payload.containsKey("status")) {
                targetStatus = payload.get("status");
            }
            if (payload.containsKey("note")) {
                note = payload.get("note");
            }
        }
        return ResponseEntity.ok(doctorOrderService.updateOrderStatus(id, targetStatus, note, userId));
    }
}
