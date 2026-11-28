package com.healthcare.clinic.lab.controller;

import com.healthcare.clinic.lab.entity.TestCatalog;
import com.healthcare.clinic.lab.service.TestCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lab/catalog")
@RequiredArgsConstructor
public class TestCatalogController {

    private final TestCatalogService testCatalogService;

    @GetMapping
    public ResponseEntity<List<TestCatalog>> getActiveCatalog() {
        return ResponseEntity.ok(testCatalogService.getActiveCatalog());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<TestCatalog>> getAllCatalog() {
        return ResponseEntity.ok(testCatalogService.getAllCatalog());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestCatalog> getTestById(@PathVariable Long id) {
        return ResponseEntity.ok(testCatalogService.getTestById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<TestCatalog> createTest(@RequestBody TestCatalog test) {
        return ResponseEntity.ok(testCatalogService.createTest(test));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<TestCatalog> updateTest(@PathVariable Long id, @RequestBody TestCatalog test) {
        return ResponseEntity.ok(testCatalogService.updateTest(id, test));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_PATHOLOGIST')")
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        testCatalogService.deleteTest(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<TestCatalog> activateTest(@PathVariable Long id) {
        return ResponseEntity.ok(testCatalogService.setStatus(id, true));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ROLE_LAB_TECH') or hasAuthority('ROLE_LAB_TECHNICIAN') or hasAuthority('ROLE_LAB') or hasAuthority('ROLE_PATHOLOGIST') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<TestCatalog> deactivateTest(@PathVariable Long id) {
        return ResponseEntity.ok(testCatalogService.setStatus(id, false));
    }
}
