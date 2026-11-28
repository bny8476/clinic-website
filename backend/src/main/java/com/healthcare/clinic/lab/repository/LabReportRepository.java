package com.healthcare.clinic.lab.repository;

import com.healthcare.clinic.lab.entity.LabReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LabReportRepository extends JpaRepository<LabReport, Long> {

    Optional<LabReport> findByReportNumber(String reportNumber);

    Optional<LabReport> findByLabRequestId(Long labRequestId);
}
