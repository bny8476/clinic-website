package com.healthcare.clinic.ai.service;

import com.healthcare.clinic.ai.dto.AiConversationDto;
import com.healthcare.clinic.ai.dto.AiMessageDto;
import com.healthcare.clinic.ai.entity.AiConversation;
import com.healthcare.clinic.ai.entity.AiMessage;
import com.healthcare.clinic.ai.repository.AiConversationRepository;
import com.healthcare.clinic.ai.repository.AiMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiConversationService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;

    @Transactional
    public AiConversation getOrCreateConversation(String conversationId, Long userId, String initialUserMessage) {
        if (conversationId != null && !conversationId.trim().isEmpty()) {
            var existing = conversationRepository.findById(conversationId);
            if (existing.isPresent()) {
                AiConversation conv = existing.get();
                // If user is authenticated, ensure ownership or associate user ID
                if (userId != null && conv.getUserId() == null) {
                    conv.setUserId(userId);
                    conversationRepository.save(conv);
                }
                return conv;
            }
        }

        // Generate new conversation
        String newId = (conversationId != null && !conversationId.trim().isEmpty()) ? conversationId : UUID.randomUUID().toString();
        String title = (initialUserMessage != null && initialUserMessage.length() > 0)
                ? (initialUserMessage.length() > 30 ? initialUserMessage.substring(0, 30) + "..." : initialUserMessage)
                : "New Chat";

        AiConversation conv = AiConversation.builder()
                .id(newId)
                .userId(userId)
                .title(title)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return conversationRepository.save(conv);
    }

    @Transactional(readOnly = true)
    public List<AiConversationDto> getUserConversations(Long userId) {
        if (userId == null) return List.of();

        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(conv -> AiConversationDto.builder()
                        .id(conv.getId())
                        .userId(conv.getUserId())
                        .title(conv.getTitle())
                        .createdAt(conv.getCreatedAt())
                        .updatedAt(conv.getUpdatedAt())
                        .messageCount(messageRepository.countByConversationId(conv.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AiMessageDto> getConversationMessages(String conversationId, Long userId) {
        if (userId != null) {
            var convOpt = conversationRepository.findById(conversationId);
            if (convOpt.isPresent() && convOpt.get().getUserId() != null && !convOpt.get().getUserId().equals(userId)) {
                log.warn("Access denied: User {} tried to view conversation {} owned by user {}", userId, conversationId, convOpt.get().getUserId());
                throw new SecurityException("Unauthorized access to conversation history");
            }
        }

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(msg -> AiMessageDto.builder()
                        .id(msg.getId())
                        .conversationId(msg.getConversationId())
                        .role(msg.getRole())
                        .content(msg.getContent())
                        .createdAt(msg.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void saveMessage(String conversationId, String role, String content) {
        AiMessage msg = AiMessage.builder()
                .conversationId(conversationId)
                .role(role)
                .content(content)
                .createdAt(Instant.now())
                .build();
        messageRepository.save(msg);

        // Touch conversation updated_at
        conversationRepository.findById(conversationId).ifPresent(conv -> {
            conv.setUpdatedAt(Instant.now());
            conversationRepository.save(conv);
        });
    }

    @Transactional
    public boolean deleteConversation(String conversationId, Long userId) {
        var convOpt = conversationRepository.findById(conversationId);
        if (convOpt.isEmpty()) return false;

        AiConversation conv = convOpt.get();
        if (userId != null && conv.getUserId() != null && !conv.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized to delete conversation");
        }

        messageRepository.deleteByConversationId(conversationId);
        conversationRepository.delete(conv);
        return true;
    }

    @Transactional
    public boolean clearConversationMessages(String conversationId, Long userId) {
        var convOpt = conversationRepository.findById(conversationId);
        if (convOpt.isEmpty()) return false;

        AiConversation conv = convOpt.get();
        if (userId != null && conv.getUserId() != null && !conv.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized to clear conversation messages");
        }

        messageRepository.deleteByConversationId(conversationId);
        return true;
    }
}
