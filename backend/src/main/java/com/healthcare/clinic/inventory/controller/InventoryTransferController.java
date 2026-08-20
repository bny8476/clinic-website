package com.healthcare.clinic.inventory.controller;

import com.healthcare.clinic.inventory.entity.InventoryTransfer;
import com.healthcare.clinic.inventory.service.InventoryTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/inventorys/inventorytransfers")
@PreAuthorize("hasAuthority('ROLE_INVENTORY_MANAGER') or hasAuthority('ROLE_STORE_MANAGER') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class InventoryTransferController {

    private final InventoryTransferService service;

    @GetMapping
    public ResponseEntity<List<InventoryTransfer>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryTransfer> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<InventoryTransfer> create(@RequestBody InventoryTransfer entity) {
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
