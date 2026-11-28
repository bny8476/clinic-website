package com.healthcare.clinic.lab.repository;

import com.healthcare.clinic.lab.entity.TestCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestCatalogRepository extends JpaRepository<TestCatalog, Long> {

    List<TestCatalog> findByIsActiveTrueOrderByTestNameAsc();

    List<TestCatalog> findAllByOrderByTestNameAsc();

    Optional<TestCatalog> findByTestCode(String testCode);

    boolean existsByTestCode(String testCode);

    List<TestCatalog> findByDepartmentAndIsActiveTrue(String department);
}
