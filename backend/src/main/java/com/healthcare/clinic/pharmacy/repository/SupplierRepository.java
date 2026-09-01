package com.healthcare.clinic.pharmacy.repository;

import com.healthcare.clinic.pharmacy.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("pharmacySupplierRepository")
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findAllByDeletedFalse();

    java.util.Optional<Supplier> findTopByOrderByIdAsc();
}
