package com.healthcare.clinic.nursing.repository;

import com.healthcare.clinic.inpatient.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("nursingWardRepository")
public interface WardRepository extends JpaRepository<Ward, Long> {
    List<Ward> findByBranchIdAndIsActiveTrue(Long branchId);
}
