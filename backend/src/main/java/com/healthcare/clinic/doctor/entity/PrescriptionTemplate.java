package com.healthcare.clinic.doctor.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "doctor_prescription_templates")
public class PrescriptionTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long doctorId;

    private String name;
    private String category;

    @Column(columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PrescriptionTemplateItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void addItem(PrescriptionTemplateItem item) {
        items.add(item);
        item.setTemplate(this);
    }

    public void removeItem(PrescriptionTemplateItem item) {
        items.remove(item);
        item.setTemplate(null);
    }
}
