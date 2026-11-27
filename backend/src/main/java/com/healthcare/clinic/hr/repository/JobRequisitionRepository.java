package com.healthcare.clinic.hr.repository;

import com.healthcare.clinic.hr.entity.JobRequisition;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRequisitionRepository extends JpaRepository<JobRequisition, Long> {
    @EntityGraph(attributePaths = {"branch"})
    List<JobRequisition> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"branch"})
    List<JobRequisition> findByBranchId(Long branchId);

    @EntityGraph(attributePaths = {"branch"})
    List<JobRequisition> findByStatus(String status);
}
