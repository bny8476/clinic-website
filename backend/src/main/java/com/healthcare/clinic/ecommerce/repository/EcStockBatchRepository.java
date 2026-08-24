package com.healthcare.clinic.ecommerce.repository;

import com.healthcare.clinic.ecommerce.entity.EcStockBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EcStockBatchRepository extends JpaRepository<EcStockBatch, Long> {
    java.util.Optional<EcStockBatch> findByProductIdAndBatchNumber(Long productId, String batchNumber);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    java.util.List<EcStockBatch> findByProductIdAndIsQuarantinedFalseAndIsRecalledFalseAndQuantityAvailableGreaterThanOrderByExpiryDateAsc(Long productId, Integer minQuantity);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT b FROM EcStockBatch b WHERE b.id = :id")
    java.util.Optional<EcStockBatch> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);
}
