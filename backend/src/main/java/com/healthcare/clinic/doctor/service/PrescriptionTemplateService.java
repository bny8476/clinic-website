package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.doctor.entity.PrescriptionTemplate;
import com.healthcare.clinic.doctor.entity.PrescriptionTemplateItem;
import com.healthcare.clinic.doctor.repository.PrescriptionTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionTemplateService {

    private final PrescriptionTemplateRepository templateRepository;

    @Transactional(readOnly = true)
    public List<PrescriptionTemplate> getTemplatesByDoctor(Long doctorId, String category) {
        if (category != null && !category.trim().isEmpty()) {
            return templateRepository.findByDoctorIdAndCategory(doctorId, category);
        }
        return templateRepository.findByDoctorId(doctorId);
    }

    @Transactional(readOnly = true)
    public PrescriptionTemplate getTemplateById(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found with id " + id));
    }

    @Transactional
    public PrescriptionTemplate createTemplate(Long doctorId, PrescriptionTemplate template) {
        template.setDoctorId(doctorId);
        if (template.getItems() != null) {
            for (PrescriptionTemplateItem item : template.getItems()) {
                item.setTemplate(template);
            }
        }
        return templateRepository.save(template);
    }

    @Transactional
    public PrescriptionTemplate updateTemplate(Long doctorId, Long id, PrescriptionTemplate updatedTemplate) {
        PrescriptionTemplate existing = getTemplateById(id);
        
        if (!existing.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Not authorized to update this template");
        }

        existing.setName(updatedTemplate.getName());
        existing.setCategory(updatedTemplate.getCategory());
        existing.setChiefComplaint(updatedTemplate.getChiefComplaint());
        existing.setDiagnosis(updatedTemplate.getDiagnosis());
        existing.setNotes(updatedTemplate.getNotes());

        existing.getItems().clear();
        if (updatedTemplate.getItems() != null) {
            for (PrescriptionTemplateItem item : updatedTemplate.getItems()) {
                existing.addItem(item);
            }
        }

        return templateRepository.save(existing);
    }

    @Transactional
    public void deleteTemplate(Long doctorId, Long id) {
        PrescriptionTemplate existing = getTemplateById(id);
        if (!existing.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Not authorized to delete this template");
        }
        templateRepository.delete(existing);
    }
}
