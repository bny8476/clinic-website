package com.healthcare.clinic.ecommerce.repository;

import com.healthcare.clinic.ecommerce.entity.EcommerceOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EcommerceOrderRepository extends JpaRepository<EcommerceOrder, Long> {
    
    List<EcommerceOrder> findByUserId(Long userId);
    
    List<EcommerceOrder> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<EcommerceOrder> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    
    List<EcommerceOrder> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    
    List<EcommerceOrder> findByDoctorIdAndStatusOrderByCreatedAtDesc(Long doctorId, String status);

    List<EcommerceOrder> findByStatus(String status);

    List<EcommerceOrder> findAllByOrderByCreatedAtDesc();
    
    Optional<EcommerceOrder> findByOrderNumber(String orderNumber);
}
