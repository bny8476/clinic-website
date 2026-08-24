package com.healthcare.clinic.ecommerce.service;

import com.healthcare.clinic.ecommerce.entity.EcStockBatch;
import com.healthcare.clinic.ecommerce.entity.EcStockMovement;
import com.healthcare.clinic.ecommerce.entity.EcStockReservation;
import com.healthcare.clinic.ecommerce.entity.EcommerceProduct;
import com.healthcare.clinic.ecommerce.repository.EcStockBatchRepository;
import com.healthcare.clinic.ecommerce.repository.EcStockMovementRepository;
import com.healthcare.clinic.ecommerce.repository.EcStockReservationRepository;
import com.healthcare.clinic.ecommerce.repository.EcommerceProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final EcStockBatchRepository batchRepository;
    private final EcStockMovementRepository movementRepository;
    private final EcStockReservationRepository reservationRepository;
    private final EcommerceProductRepository productRepository;

    @Transactional
    public void receiveStock(Long productId, Long branchId, String batchNumber, java.time.LocalDate expiryDate, int quantity, Long performedBy) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");

        EcommerceProduct product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        // Find or create batch
        EcStockBatch batch = batchRepository.findByProductIdAndBatchNumber(productId, batchNumber)
                .orElseGet(() -> EcStockBatch.builder()
                        .productId(productId)
                        .branchId(branchId)
                        .batchNumber(batchNumber)
                        .expiryDate(expiryDate)
                        .quantityTotal(0)
                        .quantityAvailable(0)
                        .quantityReserved(0)
                        .isQuarantined(false)
                        .isRecalled(false)
                        .build());

        batch.setQuantityTotal(batch.getQuantityTotal() + quantity);
        batch.setQuantityAvailable(batch.getQuantityAvailable() + quantity);
        batchRepository.save(batch);

        // Update total product stock
        product.setStockQuantity(product.getStockQuantity() + quantity);
        if ("OUT_OF_STOCK".equals(product.getProductStatus())) {
            product.setProductStatus("ACTIVE");
        }
        productRepository.save(product);

        // Audit log
        movementRepository.save(EcStockMovement.builder()
                .productId(productId)
                .batchId(batch.getId())
                .branchId(branchId)
                .movementType("RECEIVED")
                .quantity(quantity)
                .performedBy(performedBy)
                .build());
    }

    @Transactional
    public void reserveStockForCart(Long cartId, Long productId, int quantity) {
        // Find active unexpired, non-quarantined batches
        List<EcStockBatch> availableBatches = batchRepository.findByProductIdAndIsQuarantinedFalseAndIsRecalledFalseAndQuantityAvailableGreaterThanOrderByExpiryDateAsc(productId, 0);

        int remainingToReserve = quantity;
        
        for (EcStockBatch batch : availableBatches) {
            if (remainingToReserve <= 0) break;

            int canReserve = Math.min(batch.getQuantityAvailable(), remainingToReserve);
            batch.setQuantityAvailable(batch.getQuantityAvailable() - canReserve);
            batch.setQuantityReserved(batch.getQuantityReserved() + canReserve);
            batchRepository.save(batch);

            reservationRepository.save(EcStockReservation.builder()
                    .cartId(cartId)
                    .productId(productId)
                    .batchId(batch.getId())
                    .quantity(canReserve)
                    .expiresAt(ZonedDateTime.now().plusMinutes(20))
                    .status("ACTIVE")
                    .build());

            remainingToReserve -= canReserve;
        }

        if (remainingToReserve > 0) {
            throw new IllegalStateException("Insufficient stock for product " + productId);
        }
    }

    @Transactional
    public void releaseExpiredReservations() {
        List<EcStockReservation> expired = reservationRepository.findByStatusAndExpiresAtBefore("ACTIVE", ZonedDateTime.now());

        for (EcStockReservation res : expired) {
            res.setStatus("RELEASED");
            res.setReleasedAt(ZonedDateTime.now());
            reservationRepository.save(res);

            EcStockBatch batch = batchRepository.findById(res.getBatchId()).orElse(null);
            if (batch != null) {
                batch.setQuantityReserved(batch.getQuantityReserved() - res.getQuantity());
                batch.setQuantityAvailable(batch.getQuantityAvailable() + res.getQuantity());
                batchRepository.save(batch);
            }
        }
    }

    @Transactional
    public void convertReservationToSale(Long cartId, Long orderId) {
        List<EcStockReservation> activeReservations = reservationRepository.findByCartIdAndStatus(cartId, "ACTIVE");

        for (EcStockReservation res : activeReservations) {
            res.setStatus("CONVERTED");
            reservationRepository.save(res);

            EcStockBatch batch = batchRepository.findByIdWithLock(res.getBatchId()).orElseThrow();
            batch.setQuantityReserved(batch.getQuantityReserved() - res.getQuantity());
            batch.setQuantityTotal(batch.getQuantityTotal() - res.getQuantity());
            batchRepository.save(batch);

            EcommerceProduct product = productRepository.findById(res.getProductId()).orElseThrow();
            product.setStockQuantity(product.getStockQuantity() - res.getQuantity());
            if (product.getStockQuantity() == 0) {
                product.setProductStatus("OUT_OF_STOCK");
            }
            productRepository.save(product);

            movementRepository.save(EcStockMovement.builder()
                    .productId(res.getProductId())
                    .batchId(batch.getId())
                    .movementType("SOLD")
                    .quantity(res.getQuantity())
                    .referenceType("ORDER")
                    .referenceId(orderId)
                    .build());
        }
    }
}
