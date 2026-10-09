package com.healthcare.clinic.radiology.repository;

import com.healthcare.clinic.radiology.entity.ImagingProcedure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImagingProcedureRepository extends JpaRepository<ImagingProcedure, Long> {
    List<ImagingProcedure> findByIsActiveTrue();
    java.util.Optional<ImagingProcedure> findByCode(String code);
}
