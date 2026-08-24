package com.healthcare.clinic.doctor.repository;

import com.healthcare.clinic.doctor.entity.DoctorFollowUp;
import com.healthcare.clinic.doctor.entity.FollowUpStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorFollowUpRepository extends JpaRepository<DoctorFollowUp, Long> {
    List<DoctorFollowUp> findByDoctorIdOrderByFollowUpDateAsc(Long doctorId);
    List<DoctorFollowUp> findByDoctorIdAndStatusOrderByFollowUpDateAsc(Long doctorId, FollowUpStatus status);
    List<DoctorFollowUp> findByStatusIn(List<FollowUpStatus> statuses);
}
