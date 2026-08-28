package com.healthcare.clinic.vendor.controller;

import com.healthcare.clinic.backoffice.inventory.entity.BackofficePurchaseOrder;
import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.vendor.entity.VendorDelivery;
import com.healthcare.clinic.vendor.service.VendorPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendor")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VENDOR') or hasRole('SUPER_ADMIN') or hasRole('INVENTORY_MANAGER')")
public class VendorPortalController {

    private final VendorPortalService vendorService;

    @GetMapping("/purchase-orders")
    public ResponseEntity<List<BackofficePurchaseOrder>> getPurchaseOrders() {
        return ResponseEntity.ok(vendorService.getVendorPurchaseOrders());
    }

    @PatchMapping("/purchase-orders/{poId}/acknowledge")
    public ResponseEntity<BackofficePurchaseOrder> acknowledgePo(@PathVariable Long poId) {
        return ResponseEntity.ok(vendorService.acknowledgePo(poId));
    }

    @GetMapping("/deliveries")
    public ResponseEntity<List<VendorDelivery>> getDeliveries(@AuthenticationPrincipal UserPrincipal user) {
        Long userId = user != null ? user.getUserId() : null;
        return ResponseEntity.ok(vendorService.getVendorDeliveries(userId));
    }

    @PostMapping("/purchase-orders/{poId}/dispatch")
    public ResponseEntity<VendorDelivery> createDelivery(
            @PathVariable Long poId,
            @RequestBody VendorDelivery delivery,
            @AuthenticationPrincipal UserPrincipal vendorUser) {
        return ResponseEntity.ok(vendorService.createDelivery(poId, delivery, vendorUser));
    }
}
