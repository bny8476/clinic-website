package com.healthcare.clinic.doctor.medicine.repository;

import com.healthcare.clinic.doctor.medicine.entity.DoctorMedicineRecommendation;
import com.healthcare.clinic.doctor.medicine.entity.DoctorMedicineRecommendation.RecommendationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorMedicineRecommendationRepository extends JpaRepository<DoctorMedicineRecommendation, Long> {

    List<DoctorMedicineRecommendation> findByPatientIdAndStatusIn(Long patientId, List<RecommendationStatus> statuses);

    @Query("SELECT r FROM DoctorMedicineRecommendation r WHERE r.patient.userId = :userId AND r.status IN :statuses ORDER BY r.createdAt DESC")
    List<DoctorMedicineRecommendation> findByPatientUserIdAndStatusIn(@Param("userId") Long userId, @Param("statuses") List<RecommendationStatus> statuses);

    @Query("SELECT r FROM DoctorMedicineRecommendation r WHERE r.patient.id = :patientId ORDER BY r.createdAt DESC")
    List<DoctorMedicineRecommendation> findByPatientIdOrderByCreatedAtDesc(@Param("patientId") Long patientId);

    @Query("SELECT r FROM DoctorMedicineRecommendation r WHERE r.doctor.userId = :doctorUserId ORDER BY r.createdAt DESC")
    List<DoctorMedicineRecommendation> findByDoctorUserIdOrderByCreatedAtDesc(@Param("doctorUserId") Long doctorUserId);
}
