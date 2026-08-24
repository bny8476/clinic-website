package com.healthcare.clinic.branch.repository;

import com.healthcare.clinic.branch.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByIsActiveTrue();

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT b FROM Branch b WHERE b.id = :id")
    java.util.Optional<Branch> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    java.util.Optional<Branch> findFirstByOrderByIdAsc();
}
