package com.healthcare.clinic.radiology.repository;

import com.healthcare.clinic.radiology.entity.ImagingRequest;
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
public interface ImagingRequestRepository extends JpaRepository<ImagingRequest, Long> {

    List<ImagingRequest> findByStatus(String status);

    List<ImagingRequest> findByStatusInOrderByRequestedAtDesc(List<String> statuses);

    List<ImagingRequest> findByPatientId(Long patientId);

    @Query("SELECT r FROM ImagingRequest r WHERE r.doctor.id = :doctorId OR r.doctor.userId = :doctorId ORDER BY r.requestedAt DESC")
    List<ImagingRequest> findByDoctorIdOrderByRequestedAtDesc(@Param("doctorId") Long doctorId);

    @Query("SELECT r FROM ImagingRequest r WHERE r.patient.id = :patientId OR r.patient.userId = :patientId ORDER BY r.requestedAt DESC")
    List<ImagingRequest> findByPatientProfileOrUserId(@Param("patientId") Long patientId);

    List<ImagingRequest> findAllByOrderByRequestedAtDesc();

    boolean existsByPatientIdAndProcedureIdAndRequestedAtGreaterThanEqual(Long patientId, Long procedureId, ZonedDateTime requestedAt);

    long countByStatus(String status);

    long countByPriority(String priority);

    long countByRequestedAtGreaterThanEqual(ZonedDateTime after);

    long countByScheduledAtGreaterThanEqual(ZonedDateTime after);

    long countByIsCriticalTrue();

    long countByBranchIdAndStatus(Long branchId, String status);

    @Query("SELECT r FROM ImagingRequest r WHERE (:status IS NULL OR r.status = :status) " +
           "AND (:modality IS NULL OR LOWER(r.procedure.modality) = LOWER(:modality)) " +
           "AND (:priority IS NULL OR r.priority = :priority) " +
           "AND (:search IS NULL OR LOWER(r.procedure.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(r.patient.opNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR (r.accessionNumber IS NOT NULL AND LOWER(r.accessionNumber) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "     OR (r.dicomStudyUid IS NOT NULL AND LOWER(r.dicomStudyUid) LIKE LOWER(CONCAT('%', :search, '%')))) " +
           "ORDER BY r.requestedAt DESC")
    Page<ImagingRequest> searchWorklist(@Param("status") String status,
                                        @Param("modality") String modality,
                                        @Param("priority") String priority,
                                        @Param("search") String search,
                                        Pageable pageable);
}
