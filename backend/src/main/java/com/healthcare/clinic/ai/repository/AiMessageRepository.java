package com.healthcare.clinic.ai.repository;

import com.healthcare.clinic.ai.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    long countByConversationId(String conversationId);

    void deleteByConversationId(String conversationId);
}
