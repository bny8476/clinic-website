package com.healthcare.clinic.pharmacy.repository;


import com.healthcare.clinic.pharmacy.entity.PharmacyPrescriptionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("pharmacyPrescriptionRepository")
public interface PrescriptionRepository extends JpaRepository<PharmacyPrescriptionRecord, Long> {
    long countByStatus(String status);
    
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT p FROM PharmacyPrescriptionRecord p WHERE p.id = :id")
    java.util.Optional<PharmacyPrescriptionRecord> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    java.util.Optional<PharmacyPrescriptionRecord> findByClinicalPrescriptionId(Long clinicalPrescriptionId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM PharmacyPrescriptionRecord p WHERE p.status = :status AND (p.assignedPharmacyUserId IS NULL OR p.assignedPharmacyUserId = :userId)")
    java.util.List<PharmacyPrescriptionRecord> findByStatusAndAssignedUserId(@org.springframework.data.repository.query.Param("status") String status, @org.springframework.data.repository.query.Param("userId") Long userId);
}
