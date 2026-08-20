package com.healthcare.clinic.inventory.controller;


import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.cache.annotation.Cacheable;


@RestController("pharmacyLookupController")
@RequestMapping("/api/pharmacy/lookups")
@org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
public class LookupController {

    private final JdbcTemplate jdbcTemplate;

    public LookupController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Cacheable(value = "lookups", key = "#lookupType")
    @GetMapping("/{lookupType}")
    public List<Map<String, Object>> getLookupsByType(@PathVariable String lookupType) {
        String query = "SELECT lookup_key, lookup_value FROM system_lookups " +
                "WHERE lookup_type = ? AND is_active = 1 ORDER BY display_order ASC";
        return jdbcTemplate.queryForList(query, lookupType);
    }

    @Cacheable(value = "bulkLookups", key = "#types ?: 'all'")
    @GetMapping("/bulk")
    public Map<String, List<Map<String, Object>>> getBulkLookups(@RequestParam(required = false) String types) {
        String query;
        List<Map<String, Object>> allLookups;

        if (types != null && !types.isEmpty()) {
            String[] typesArray = types.split(",");
            String inSql = String.join(",", java.util.Collections.nCopies(typesArray.length, "?"));
            query = "SELECT lookup_type, lookup_key, lookup_value FROM system_lookups " +
                    "WHERE lookup_type IN (" + inSql + ") AND is_active = 1 ORDER BY lookup_type, display_order ASC";
            allLookups = jdbcTemplate.queryForList(query, (Object[]) typesArray);
        } else {
            // If no types specified, fetch all commonly used lookup types
            query = "SELECT lookup_type, lookup_key, lookup_value FROM system_lookups " +
                    "WHERE is_active = 1 ORDER BY lookup_type, display_order ASC";
            allLookups = jdbcTemplate.queryForList(query);
        }

        // Group by lookup_type
        Map<String, List<Map<String, Object>>> groupedLookups = new HashMap<>();
        for (Map<String, Object> row : allLookups) {
            String type = (String) row.get("lookup_type");
            groupedLookups.computeIfAbsent(type, k -> new ArrayList<>()).add(row);
        }
        
        return groupedLookups;
    }
}
