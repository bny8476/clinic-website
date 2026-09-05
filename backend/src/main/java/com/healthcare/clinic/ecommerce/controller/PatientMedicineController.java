package com.healthcare.clinic.ecommerce.controller;

import com.healthcare.clinic.ecommerce.entity.EcommerceProduct;
import com.healthcare.clinic.ecommerce.service.ProductCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/medicines")
@RequiredArgsConstructor
public class PatientMedicineController {

    private final ProductCatalogService catalogService;

    @GetMapping
    public ResponseEntity<Page<EcommerceProduct>> getMedicines(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean rxRequired,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(catalogService.searchProducts(q, category, rxRequired, sortBy, page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<EcommerceProduct>> searchMedicines(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean rxRequired,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(catalogService.searchProducts(q, category, rxRequired, sortBy, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EcommerceProduct> getMedicineDetails(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getProductDetails(id));
    }
}
