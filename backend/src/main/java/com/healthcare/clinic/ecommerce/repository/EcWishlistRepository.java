package com.healthcare.clinic.ecommerce.repository;

import com.healthcare.clinic.ecommerce.entity.EcWishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EcWishlistRepository extends JpaRepository<EcWishlist, Long> {
    java.util.List<EcWishlist> findByPatientId(Long patientId);
    java.util.Optional<EcWishlist> findByPatientIdAndProductId(Long patientId, Long productId);
}
