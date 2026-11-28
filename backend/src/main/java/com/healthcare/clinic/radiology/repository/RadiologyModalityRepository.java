package com.healthcare.clinic.radiology.repository;

import com.healthcare.clinic.radiology.entity.RadiologyModality;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RadiologyModalityRepository extends JpaRepository<RadiologyModality, Long> {
    List<RadiologyModality> findByIsActiveTrueOrderByModalityTypeAsc();
    List<RadiologyModality> findByModalityTypeAndIsActiveTrue(String modalityType);
    Optional<RadiologyModality> findByCode(String code);
}
