package com.healthcare.clinic.ecommerce.repository;

import com.healthcare.clinic.ecommerce.entity.EcCart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EcCartRepository extends JpaRepository<EcCart, Long> {
    java.util.Optional<EcCart> findByPatientIdAndStatus(Long patientId, String status);
    java.util.Optional<EcCart> findBySessionKeyAndStatus(String sessionKey, String status);
}
