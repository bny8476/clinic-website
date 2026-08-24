package com.healthcare.clinic.search.controller;

import com.healthcare.clinic.search.dto.GlobalSearchResultDto;
import com.healthcare.clinic.search.service.GlobalSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class GlobalSearchController {

    private final GlobalSearchService globalSearchService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<GlobalSearchResultDto>> search(@RequestParam String q) {
        return ResponseEntity.ok(globalSearchService.performGlobalSearch(q));
    }
}
