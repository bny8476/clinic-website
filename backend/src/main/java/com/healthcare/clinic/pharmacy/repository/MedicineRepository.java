package com.healthcare.clinic.pharmacy.repository;

import com.healthcare.clinic.pharmacy.entity.Medicine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository("pharmacyMedicineRepository")
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    java.util.Optional<Medicine> findTopByOrderByIdAsc();

    List<Medicine> findByNameContainingIgnoreCase(String name);
    Optional<Medicine> findByBarcode(String barcode);
    List<Medicine> findByCategory(String category);

    @Query("SELECT m FROM Medicine m WHERE " +
           "(COALESCE(:search, '') = '' OR LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.genericName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.medicineCode) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(COALESCE(:drugClass, 'ALL') = 'ALL' OR :drugClass = '' OR m.drugClass = :drugClass) AND " +
           "(COALESCE(:schedule, 'ALL') = 'ALL' OR :schedule = '' OR m.schedule = :schedule) AND " +
           "(COALESCE(:productType, 'ALL') = 'ALL' OR :productType = '' OR m.productType = :productType)")
    Page<Medicine> searchMedicines(
        @Param("search") String search, 
        @Param("drugClass") String drugClass, 
        @Param("schedule") String schedule, 
        @Param("productType") String productType, 
        Pageable pageable);
}
