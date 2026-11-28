package com.healthcare.clinic.lab.repository;

import com.healthcare.clinic.lab.entity.LabRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LabRequestRepository extends JpaRepository<LabRequest, Long> {

    Optional<LabRequest> findByLabRequestNumber(String labRequestNumber);

    List<LabRequest> findByStatusOrderByRequestedAtDesc(String status);

    List<LabRequest> findByStatusInOrderByRequestedAtDesc(List<String> statuses);

    List<LabRequest> findByPatientIdOrderByRequestedAtDesc(Long patientId);

    List<LabRequest> findByPatientProfileIdOrderByRequestedAtDesc(Long patientProfileId);

    @Query("SELECT r FROM LabRequest r WHERE r.doctorProfile.id = :doctorId OR r.doctorProfile.userId = :doctorId OR r.doctorUser.id = :doctorId ORDER BY r.requestedAt DESC")
    List<LabRequest> findByDoctorIdOrderByRequestedAtDesc(@Param("doctorId") Long doctorId);

    List<LabRequest> findByBranchIdOrderByRequestedAtDesc(Long branchId);

    long countByStatus(String status);

    long countByPriority(String priority);

    long countByBranchIdAndRequestedAtAfter(Long branchId, ZonedDateTime after);

    long countByRequestedAtAfter(ZonedDateTime after);

    long countByBranchIdAndStatus(Long branchId, String status);

    long countByBranchIdAndPriority(Long branchId, String priority);

    @Query("SELECT r FROM LabRequest r WHERE (:status IS NULL OR r.status = :status) " +
           "AND (:priority IS NULL OR r.priority = :priority) " +
           "AND (:search IS NULL OR LOWER(r.labRequestNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(r.testCatalog.testName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR (r.patientFirstName IS NOT NULL AND LOWER(r.patientFirstName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "     OR (r.patientLastName IS NOT NULL AND LOWER(r.patientLastName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "     OR (r.patientUser IS NOT NULL AND (LOWER(r.patientUser.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(r.patientUser.lastName) LIKE LOWER(CONCAT('%', :search, '%')))) " +
           "     OR (r.patientProfile IS NOT NULL AND LOWER(r.patientProfile.opNumber) LIKE LOWER(CONCAT('%', :search, '%')))) " +
           "ORDER BY r.requestedAt DESC")
    Page<LabRequest> searchWorklist(@Param("status") String status,
                                   @Param("priority") String priority,
                                   @Param("search") String search,
                                   Pageable pageable);

    List<LabRequest> findTop20ByBranchIdOrderByRequestedAtDesc(Long branchId);
}
