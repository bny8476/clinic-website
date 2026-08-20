package com.healthcare.clinic.pharmacy.service;

import com.healthcare.clinic.pharmacy.entity.WardReplacementRequest;
import com.healthcare.clinic.pharmacy.entity.WardReplacementRequestItem;
import com.healthcare.clinic.pharmacy.repository.WardReplacementRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WardReplacementService {

    private final WardReplacementRequestRepository repository;

    public WardReplacementService(WardReplacementRequestRepository repository) {
        this.repository = repository;
    }

    public List<WardReplacementRequest> getPendingReplacements() {
        return repository.findByStatusOrderByCreatedAtDesc("PENDING");
    }

    public List<WardReplacementRequest> getAllReplacements() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public record ReplacementItemRequest(String medicineName, Integer qty, Integer availableStock) {}

    @Transactional
    public WardReplacementRequest createRequest(String ward, String requestedBy, List<ReplacementItemRequest> items) {
        WardReplacementRequest request = new WardReplacementRequest();
        request.setRequestNumber("REQ-" + System.currentTimeMillis());
        request.setWard(ward);
        request.setRequestedBy(requestedBy);
        request.setStatus("PENDING");
        request.setRequestDate(LocalDateTime.now());

        items.forEach(i -> {
            WardReplacementRequestItem item = new WardReplacementRequestItem();
            item.setRequest(request);
            item.setMedicineName(i.medicineName());
            item.setRequestedQty(i.qty());
            item.setAvailableStockAtRequest(i.availableStock());
            request.getItems().add(item);
        });

        return repository.save(request);
    }

    @Transactional
    public void approve(Long id) {
        WardReplacementRequest request = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Replacement request not found: " + id));
        request.setStatus("APPROVED");
        repository.save(request);
    }

    @Transactional
    public void reject(Long id) {
        WardReplacementRequest request = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Replacement request not found: " + id));
        request.setStatus("REJECTED");
        repository.save(request);
    }
}
