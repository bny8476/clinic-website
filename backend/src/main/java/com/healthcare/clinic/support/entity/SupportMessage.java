package com.healthcare.clinic.support.entity;

import com.healthcare.clinic.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;

@Entity
@Table(name = "support_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "user", "assignedAgent"})
    private SupportTicket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "roles", "clinicBranch", "passwordHash"})
    private User sender;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "is_agent_response", nullable = false)
    @Builder.Default
    private Boolean isAgentResponse = false;

    @Transient
    public String getSenderName() {
        if (sender != null) {
            String name = (sender.getFirstName() != null ? sender.getFirstName() + " " : "") +
                          (sender.getLastName() != null ? sender.getLastName() : "");
            return name.trim().isEmpty() ? sender.getEmail() : name.trim();
        }
        return Boolean.TRUE.equals(isAgentResponse) ? "Support Agent" : "Requester";
    }

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
}
