package com.healthcare.clinic.ai.repository;
import com.healthcare.clinic.patient.entity.AiChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {
    List<AiChatMessage> findBySessionIdOrderBySentAtAsc(Long sessionId);
}
