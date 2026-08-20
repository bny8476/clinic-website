package com.healthcare.clinic.pharmacy.controller;


import com.healthcare.clinic.common.dto.ApiResponse;
import com.healthcare.clinic.pharmacy.service.BarcodeScanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;

@RestController("pharmacyBarcodeController")
@RequestMapping("/api/pharmacy/barcode")
@org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN','ROLE_PHARMACIST')")
public class BarcodeController {

    private final BarcodeScanService service;

    public BarcodeController(BarcodeScanService service) {
        this.service = service;
    }

    @PostMapping("/scan")
    public ResponseEntity<ApiResponse<Map<String, Object>>> scan(
            @RequestBody Map<String, String> body, @RequestParam Long userId) {
        String barcodeValue = body.get("barcodeValue");
        String scanModule = body.get("scanModule");
        if (barcodeValue == null || barcodeValue.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Barcode value is required"));
        }
        return ResponseEntity.ok(ApiResponse.success(service.resolveScan(barcodeValue, scanModule, userId), "Scan resolved"));
    }
}
