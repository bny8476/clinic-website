package com.healthcare.clinic.backoffice.inventory.controller;

import com.healthcare.clinic.backoffice.inventory.entity.*;
import com.healthcare.clinic.backoffice.inventory.service.BackofficeInventoryService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/backoffice/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INVENTORY_MANAGER') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
public class BackofficeInventoryController {

    private final BackofficeInventoryService inventoryService;

    @GetMapping("/warehouses")
    public ResponseEntity<List<Warehouse>> getWarehouses() {
        return ResponseEntity.ok(inventoryService.getAllWarehouses());
    }

    @PostMapping("/warehouses")
    public ResponseEntity<Warehouse> createWarehouse(@RequestBody Warehouse warehouse) {
        return ResponseEntity.ok(inventoryService.createWarehouse(warehouse));
    }

    @GetMapping("/stock")
    public ResponseEntity<List<StockItem>> getStock() {
        return ResponseEntity.ok(inventoryService.getAllStockItems());
    }

    @PostMapping("/stock")
    public ResponseEntity<StockItem> addStockItem(@RequestBody StockItem item) {
        return ResponseEntity.ok(inventoryService.saveStockItem(item));
    }

    @GetMapping("/suppliers")
    public ResponseEntity<List<BackofficeSupplier>> getSuppliers() {
        return ResponseEntity.ok(inventoryService.getAllSuppliers());
    }

    @PostMapping("/suppliers")
    public ResponseEntity<BackofficeSupplier> createSupplier(@RequestBody BackofficeSupplier supplier) {
        return ResponseEntity.ok(inventoryService.createSupplier(supplier));
    }

    @GetMapping("/purchase-orders")
    public ResponseEntity<List<BackofficePurchaseOrder>> getPurchaseOrders() {
        return ResponseEntity.ok(inventoryService.getAllPurchaseOrders());
    }

    @PostMapping("/purchase-orders")
    public ResponseEntity<BackofficePurchaseOrder> createPurchaseOrder(
            @RequestBody BackofficePurchaseOrder po,
            @AuthenticationPrincipal UserPrincipal user) {
        po.setRaisedBy(user != null ? user.getUserId() : null);
        return ResponseEntity.ok(inventoryService.createPurchaseOrder(po));
    }

    @PatchMapping("/purchase-orders/{id}/status")
    public ResponseEntity<BackofficePurchaseOrder> updatePoStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(inventoryService.updatePoStatus(id, status));
    }

    @GetMapping("/transfers")
    public ResponseEntity<List<StockTransfer>> getTransfers() {
        return ResponseEntity.ok(inventoryService.getAllStockTransfers());
    }

    @PostMapping("/transfers")
    public ResponseEntity<StockTransfer> createTransfer(
            @RequestBody StockTransfer transfer,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(inventoryService.createStockTransfer(transfer, user != null ? user.getUserId() : null));
    }
}
