package com.healthcare.clinic.ecommerce.repository;

import com.healthcare.clinic.ecommerce.entity.EcommerceProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EcommerceProductRepository extends JpaRepository<EcommerceProduct, Long> {
    
    List<EcommerceProduct> findByIsActiveTrue();
    
    Page<EcommerceProduct> findByIsActiveTrue(Pageable pageable);
    
    List<EcommerceProduct> findByDoctorId(Long doctorId);

    @Query("SELECT p FROM EcommerceProduct p WHERE p.isActive = true " +
           "AND (CAST(:query AS string) IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) " +
           "     OR LOWER(p.genericName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) " +
           "     OR LOWER(p.brandName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) " +
           "     OR LOWER(p.manufacturer) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) " +
           "     OR LOWER(p.category) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))) " +
           "AND (CAST(:category AS string) IS NULL OR LOWER(p.category) = LOWER(CAST(:category AS string))) " +
           "AND (:rxRequired IS NULL OR p.prescriptionRequired = :rxRequired)")
    Page<EcommerceProduct> searchMedicines(
            @Param("query") String query,
            @Param("category") String category,
            @Param("rxRequired") Boolean rxRequired,
            Pageable pageable);
}
