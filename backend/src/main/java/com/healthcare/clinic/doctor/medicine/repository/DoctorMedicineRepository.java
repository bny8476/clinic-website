package com.healthcare.clinic.doctor.medicine.repository;

import com.healthcare.clinic.doctor.medicine.entity.DoctorMedicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorMedicineRepository extends JpaRepository<DoctorMedicine, Long> {
    List<DoctorMedicine> findAllByDoctorId(Long doctorId);
    List<DoctorMedicine> findAllByDoctorIdAndIsActiveTrue(Long doctorId);
    List<DoctorMedicine> findByDoctorIdInAndIsActiveTrue(List<Long> doctorIds);
    List<DoctorMedicine> findByIsActiveTrue();
}
