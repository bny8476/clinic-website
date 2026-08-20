package com.healthcare.clinic.inventory.controller;

import com.healthcare.clinic.superadmin.entity.SystemConfiguration;
import com.healthcare.clinic.superadmin.repository.SystemConfigurationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController("pharmacyConfigController")
@RequestMapping("/api/pharmacy/config")
public class ConfigController {

    @Autowired
    private SystemConfigurationRepository configRepository;

    @GetMapping("/public")
    public Map<String, Object> getPublicConfiguration() {
        List<SystemConfiguration> configs = configRepository.findAll();

        Map<String, Object> configMap = new HashMap<>();
        for (SystemConfiguration config : configs) {
            String key = config.getConfigKey();
            String value = config.getConfigVal();

            if (value != null) {
                if (value.equalsIgnoreCase("true") || value.equalsIgnoreCase("false")) {
                    configMap.put(key, Boolean.parseBoolean(value));
                } else if (value.matches("-?\\d+")) {
                    configMap.put(key, Integer.parseInt(value));
                } else if (value.matches("-?\\d+\\.\\d+")) {
                    configMap.put(key, Double.parseDouble(value));
                } else {
                    configMap.put(key, value);
                }
            } else {
                configMap.put(key, null);
            }
        }

        return configMap;
    }
}

