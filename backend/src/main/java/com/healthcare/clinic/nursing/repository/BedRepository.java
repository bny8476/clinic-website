package com.healthcare.clinic.nursing.repository;

import com.healthcare.clinic.inpatient.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository("nursingBedRepository")
public interface BedRepository extends JpaRepository<Bed, Long> {
    List<Bed> findByRoomWardId(Long wardId);
    Optional<Bed> findByRoomWardIdAndBedNumber(Long wardId, String bedNumber);
}
