package com.healthcare.clinic.ecommerce.repository;

import com.healthcare.clinic.ecommerce.entity.EcStockReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EcStockReservationRepository extends JpaRepository<EcStockReservation, Long> {
    java.util.List<EcStockReservation> findByStatusAndExpiresAtBefore(String status, java.time.ZonedDateTime date);
    java.util.List<EcStockReservation> findByCartIdAndStatus(Long cartId, String status);
}
