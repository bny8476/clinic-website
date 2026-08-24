package com.healthcare.clinic.pharmacy.repository;


import com.healthcare.clinic.pharmacy.entity.StockBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("pharmacyStockBatchRepository")
public interface StockBatchRepository extends JpaRepository<StockBatch, String> {

    @Query("SELECT b FROM StockBatch b WHERE b.quantityAvailable > 0 ORDER BY b.expiryDate ASC")
    org.springframework.data.domain.Page<StockBatch> findAllOrderByFefo(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT b FROM StockBatch b WHERE b.expiryDate <= :maxDate AND b.expiryDate >= :today AND b.quantityAvailable > 0")
    List<StockBatch> findExpiringWithinDays(@Param("today") java.time.LocalDate today, @Param("maxDate") java.time.LocalDate maxDate);

    @Query("SELECT b FROM StockBatch b WHERE b.expiryDate < :today AND b.quantityAvailable > 0")
    List<StockBatch> findExpiredBatches(@Param("today") java.time.LocalDate today);

    @Query("SELECT b FROM StockBatch b WHERE b.medicine.id = :medicineId AND b.expired = false AND b.quarantined = false AND b.quantityAvailable > 0 ORDER BY b.expiryDate ASC")
    List<StockBatch> findBatchesForDispensing(@Param("medicineId") Long medicineId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM StockBatch b WHERE b.medicine.id = :medicineId AND b.expired = false AND b.quarantined = false AND b.quantityAvailable > 0 ORDER BY b.expiryDate ASC")
    List<StockBatch> findBatchesForDispensingWithLock(@Param("medicineId") Long medicineId);
    
    @Query("SELECT COUNT(b) FROM StockBatch b WHERE b.quantityAvailable > 0")
    long countActiveBatches();

    @Query("SELECT COUNT(b) FROM StockBatch b WHERE b.expiryDate BETWEEN :today AND :maxDate AND b.quantityAvailable > 0")
    long countExpiringBatches(@Param("today") java.time.LocalDate today, @Param("maxDate") java.time.LocalDate maxDate);

    @Query("SELECT SUM(b.purchasePrice * b.quantityAvailable) FROM StockBatch b WHERE b.expiryDate < :today AND b.quantityAvailable > 0")
    java.math.BigDecimal sumExpiredStockValue(@Param("today") java.time.LocalDate today);
    
    List<StockBatch> findByExpiryDateBeforeAndExpiredFalse(java.time.LocalDate today);

    List<StockBatch> findByExpiryDateBeforeAndQuantityAvailableGreaterThan(java.time.LocalDate maxDate, Integer minQuantity);

    List<StockBatch> findByQuantityAvailableBetween(Integer minQuantity, Integer maxQuantity);
}
