package com.healthcare.clinic.document.repository;

import com.healthcare.clinic.document.entity.DocumentShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentShareRepository extends JpaRepository<DocumentShare, Long> {
    Optional<DocumentShare> findByShareToken(String shareToken);
    List<DocumentShare> findByDocumentIdAndSharedWithUserId(Long documentId, Long sharedWithUserId);
}

