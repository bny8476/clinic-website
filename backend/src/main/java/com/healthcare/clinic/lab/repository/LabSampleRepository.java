package com.healthcare.clinic.lab.repository;

import com.healthcare.clinic.lab.entity.LabSample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabSampleRepository extends JpaRepository<LabSample, Long> {

    Optional<LabSample> findBySampleBarcode(String sampleBarcode);

    List<LabSample> findByLabRequestId(Long labRequestId);

    List<LabSample> findByStatusOrderByCollectedAtDesc(String status);
}
