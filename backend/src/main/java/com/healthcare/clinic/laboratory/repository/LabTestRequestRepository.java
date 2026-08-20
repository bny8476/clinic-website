package com.healthcare.clinic.laboratory.repository;

import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LabTestRequestRepository extends JpaRepository<LabTestRequest, Long>, JpaSpecificationExecutor<LabTestRequest> {
    @EntityGraph(attributePaths = {"patient", "doctor", "testCatalog"})
    List<LabTestRequest> findAll();

    @EntityGraph(attributePaths = {"patient", "doctor", "testCatalog"})
    List<LabTestRequest> findByStatus(String status);
    List<LabTestRequest> findByPatientIdOrderByRequestedAtDesc(Long patientId);
    List<LabTestRequest> findByPatientIdAndAcknowledgedAtIsNotNullOrderByRequestedAtDesc(Long patientId);
    List<LabTestRequest> findByDoctorUserIdOrderByRequestedAtDesc(Long doctorUserId);
    List<LabTestRequest> findByDoctorUserIdAndAcknowledgedAtIsNullAndStatusOrderByRequestedAtDesc(Long doctorUserId, String status);

    @Query("SELECT r.status, COUNT(r) FROM LabTestRequest r GROUP BY r.status")
    List<Object[]> countByStatus();

    long countAllByStatus(String status);

    @Query("SELECT r.priority, COUNT(r) FROM LabTestRequest r GROUP BY r.priority")
    List<Object[]> countByPriority();

    @Query("SELECT COUNT(r) FROM LabTestRequest r WHERE r.requestedAt >= :startOfDay")
    long countRequestsSince(@Param("startOfDay") java.time.ZonedDateTime startOfDay);

    @Query("SELECT SUM(r.testCatalog.price) FROM LabTestRequest r WHERE r.status IN ('VERIFIED', 'RELEASED')")
    java.math.BigDecimal calculateTotalRevenue();

    @Query(value = "SELECT c.test_name, AVG(DATE_PART('epoch', r.released_at) - DATE_PART('epoch', r.requested_at)) " +
           "FROM lab_test_requests r JOIN lab_test_catalog c ON r.test_catalog_id = c.id " +
           "WHERE r.status = 'RELEASED' AND r.released_at IS NOT NULL " +
           "GROUP BY c.test_name", nativeQuery = true)
    List<Object[]> averageTatByTest();

    @Query("SELECT CONCAT(u.firstName, ' ', u.lastName), COUNT(r) " +
           "FROM LabTestRequest r JOIN r.processingDetails pd JOIN pd.assignedTechnician u " +
           "WHERE r.status IN ('PROCESSING', 'VERIFIED', 'RELEASED') " +
           "GROUP BY u.id, u.firstName, u.lastName")
    List<Object[]> countByAssignedTechnician();

    boolean existsByPatientIdAndTestCatalogIdAndStatusIn(Long patientId, Long testCatalogId, List<String> statuses);

    @EntityGraph(attributePaths = {"patient", "doctor", "testCatalog"})
    List<LabTestRequest> findByBranchId(Long branchId);
}
