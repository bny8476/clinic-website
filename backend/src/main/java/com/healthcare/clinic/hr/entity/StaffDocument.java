package com.healthcare.clinic.hr.entity;

import com.healthcare.clinic.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.ZonedDateTime;

@Entity
@Table(name = "staff_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class StaffDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "staff_id", nullable = false)
    private User staff;

    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType; // e.g. CONTRACT, ID, CERTIFICATION

    @Column(nullable = false)
    private String filename;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "uploaded_by")
    private Long uploadedBy; // User ID who uploaded it

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @Transient
    public String getStaffName() {
        if (staff != null) {
            String f = staff.getFirstName() != null ? staff.getFirstName() : "";
            String l = staff.getLastName() != null ? staff.getLastName() : "";
            return (f + " " + l).trim();
        }
        return null;
    }

    @Transient
    public String getStaffEmail() {
        return staff != null ? staff.getEmail() : null;
    }
}
