package com.healthcare.clinic.support.entity;

import com.healthcare.clinic.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;

@Entity
@Table(name = "support_tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_number", nullable = false, unique = true, length = 50)
    private String ticketNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "roles", "clinicBranch", "passwordHash"})
    private User user;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String category = "GENERAL"; // GENERAL, BILLING, TECHNICAL, APPOINTMENT, PHARMACY

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, URGENT

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "OPEN"; // OPEN, IN_PROGRESS, RESOLVED, CLOSED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_agent_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "roles", "clinicBranch", "passwordHash"})
    private User assignedAgent;

    @Transient
    private String description;

    @Transient
    public String getRequesterName() {
        if (user != null) {
            String name = (user.getFirstName() != null ? user.getFirstName() + " " : "") +
                          (user.getLastName() != null ? user.getLastName() : "");
            return name.trim().isEmpty() ? user.getEmail() : name.trim();
        }
        return "Support Requester";
    }

    @Transient
    public String getRequesterEmail() {
        return user != null ? user.getEmail() : null;
    }

    @Transient
    public String getRequesterRole() {
        if (user != null && user.getAuthorities() != null && !user.getAuthorities().isEmpty()) {
            return user.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        }
        return "USER";
    }

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;
}
