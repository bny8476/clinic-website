package com.healthcare.clinic.pharmacy.service;


import com.healthcare.clinic.pharmacy.entity.PharmacyClearance;
import com.healthcare.clinic.pharmacy.repository.PharmacyClearanceRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PharmacyClearanceService {

    private final PharmacyClearanceRepository pharmacyClearanceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<PharmacyClearance> getAllClearances() {
        return pharmacyClearanceRepository.findAll();
    }

    @Transactional(readOnly = true)
    public User fetchUserByEmail(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Main orchestrator method (not transactional itself to avoid spanning DBs)
    public PharmacyClearance markAsCleared(Long id, String userEmail) {
        User user = fetchUserByEmail(userEmail);
        return updateClearanceRecord(id, user);
    }

    @Transactional
    public PharmacyClearance updateClearanceRecord(Long id, User user) {
        PharmacyClearance clearance = pharmacyClearanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Clearance record not found"));

        if ("Cleared".equals(clearance.getStatus())) {
            return clearance;
        }

        clearance.setStatus("Cleared");
        clearance.setClearedAt(ZonedDateTime.now());
        clearance.setClearedByUserId(user.getId());
        
        return pharmacyClearanceRepository.save(clearance);
    }
}
