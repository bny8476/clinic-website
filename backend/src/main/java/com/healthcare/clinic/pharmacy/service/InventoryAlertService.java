package com.healthcare.clinic.pharmacy.service;

import com.healthcare.clinic.pharmacy.entity.StockBatch;
import com.healthcare.clinic.pharmacy.repository.StockBatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryAlertService {

    private final StockBatchRepository stockBatchRepository;

    // Run every day at 1 AM
    @Scheduled(cron = "0 0 1 * * ?")
    public void checkNearExpiryAndLowStock() {
        log.info("Running daily inventory alert checks...");
        
        LocalDate thirtyDaysFromNow = LocalDate.now().plusDays(30);

        List<StockBatch> nearExpiryBatches = stockBatchRepository.findByExpiryDateBeforeAndQuantityAvailableGreaterThan(thirtyDaysFromNow, 0);

        if (!nearExpiryBatches.isEmpty()) {
            log.warn("Found {} batches near expiry or expired.", nearExpiryBatches.size());
            // In a full implementation, we'd fire a websocket event or email to pharmacists here
            for (StockBatch batch : nearExpiryBatches) {
                log.warn("Batch {} for Medicine ID {} is near expiry ({})", 
                        batch.getBatchNumber(), batch.getMedicine().getId(), batch.getExpiryDate());
            }
        }

        List<StockBatch> lowStockBatches = stockBatchRepository.findByQuantityAvailableBetween(1, 19);

        if (!lowStockBatches.isEmpty()) {
            log.warn("Found {} batches with low stock.", lowStockBatches.size());
            // Fire low stock notifications
            for (StockBatch batch : lowStockBatches) {
                log.warn("Batch {} for Medicine ID {} is low on stock (Quantity: {})", 
                        batch.getBatchNumber(), batch.getMedicine().getId(), batch.getQuantityAvailable());
            }
        }
    }
}
