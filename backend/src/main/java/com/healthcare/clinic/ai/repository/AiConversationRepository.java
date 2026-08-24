package com.healthcare.clinic.ai.repository;

import com.healthcare.clinic.ai.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, String> {

    List<AiConversation> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<AiConversation> findByIdAndUserId(String id, Long userId);
}
