package com.healthcare.clinic.ecommerce.controller;

import com.healthcare.clinic.ecommerce.entity.EcommerceOrder;
import com.healthcare.clinic.ecommerce.service.OrderService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ecommerce/orders")
@RequiredArgsConstructor
public class EcOrderController {

    private final OrderService orderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'SUPER_ADMIN', 'PHARMACIST')")
    public ResponseEntity<List<EcommerceOrder>> getOrders(@AuthenticationPrincipal UserPrincipal user) {
        boolean isPatient = user.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_PATIENT") || r.getAuthority().equals("PATIENT"));
        if (isPatient) {
            return ResponseEntity.ok(orderService.getPatientOrders(user.getUserId()));
        } else {
            return ResponseEntity.ok(orderService.getAllOrders());
        }
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'SUPER_ADMIN', 'PHARMACIST')")
    public ResponseEntity<EcommerceOrder> getOrderDetails(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long orderId) {
        boolean isPatient = user.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_PATIENT") || r.getAuthority().equals("PATIENT"));
        if (isPatient) {
            return ResponseEntity.ok(orderService.getOrderDetails(orderId, user.getUserId()));
        } else {
            return ResponseEntity.ok(orderService.getOrderDetailsForAdmin(orderId));
        }
    }

    @PostMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<Void> updateOrderStatus(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long orderId,
            @RequestParam String status,
            @RequestParam(required = false) String note) {
        String roleName = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("USER");
        orderService.updateOrderStatus(orderId, status, user.getUserId(), roleName, note);
        return ResponseEntity.ok().build();
    }
    
    @PatchMapping("/{orderId}/shipping")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<Void> updateShipping(
            @PathVariable Long orderId,
            @RequestParam String status,
            @RequestParam(required = false) String trackingNumber) {
        orderService.updateShipping(orderId, status, trackingNumber);
        return ResponseEntity.ok().build();
    }
}
