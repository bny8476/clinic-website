package com.healthcare.clinic.ecommerce.repository;

import com.healthcare.clinic.ecommerce.entity.EcPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EcPaymentRepository extends JpaRepository<EcPayment, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    java.util.Optional<EcPayment> findByOrderIdAndPaymentMethod(Long orderId, String paymentMethod);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    java.util.Optional<EcPayment> findByProviderRef(String providerRef);

    java.util.Optional<EcPayment> findByOrderIdAndStatus(Long orderId, String status);

    java.util.Optional<EcPayment> findFirstByOrderId(Long orderId);
}
