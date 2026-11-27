package com.healthcare.clinic.hr.service;

import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.hr.entity.JobApplication;
import com.healthcare.clinic.hr.entity.JobRequisition;
import com.healthcare.clinic.hr.repository.JobApplicationRepository;
import com.healthcare.clinic.hr.repository.JobRequisitionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@Transactional
public class RecruitmentService {

    private final JobRequisitionRepository requisitionRepository;
    private final JobApplicationRepository applicationRepository;
    private final BranchRepository branchRepository;

    public RecruitmentService(JobRequisitionRepository requisitionRepository, 
                              JobApplicationRepository applicationRepository,
                              BranchRepository branchRepository) {
        this.requisitionRepository = requisitionRepository;
        this.applicationRepository = applicationRepository;
        this.branchRepository = branchRepository;
    }

    public JobRequisition createRequisition(JobRequisition requisition) {
        if (requisition.getBranch() == null || requisition.getBranch().getId() == null) {
            Branch defaultBranch = branchRepository.findAll().stream().findFirst().orElse(null);
            requisition.setBranch(defaultBranch);
        } else {
            branchRepository.findById(requisition.getBranch().getId()).ifPresent(requisition::setBranch);
        }
        if (requisition.getStatus() == null || requisition.getStatus().isBlank()) {
            requisition.setStatus("POSTED");
        }
        return requisitionRepository.save(requisition);
    }

    public List<JobRequisition> getActiveRequisitions() {
        List<JobRequisition> active = requisitionRepository.findByStatus("POSTED");
        if (active.isEmpty() && requisitionRepository.count() == 0) {
            seedInitialRequisitions();
            active = requisitionRepository.findByStatus("POSTED");
        }
        return active;
    }

    public List<JobRequisition> getAllRequisitions() {
        List<JobRequisition> list = requisitionRepository.findAllByOrderByCreatedAtDesc();
        if (list.isEmpty()) {
            seedInitialRequisitions();
            list = requisitionRepository.findAllByOrderByCreatedAtDesc();
        }
        return list;
    }

    public JobRequisition updateRequisition(Long id, JobRequisition updated) {
        JobRequisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid requisition ID: " + id));

        if (updated.getTitle() != null && !updated.getTitle().isBlank()) {
            req.setTitle(updated.getTitle());
        }
        if (updated.getDepartment() != null && !updated.getDepartment().isBlank()) {
            req.setDepartment(updated.getDepartment());
        }
        if (updated.getVacancyCount() != null) {
            req.setVacancyCount(updated.getVacancyCount());
        }
        if (updated.getMinSalary() != null) {
            req.setMinSalary(updated.getMinSalary());
        }
        if (updated.getMaxSalary() != null) {
            req.setMaxSalary(updated.getMaxSalary());
        }
        if (updated.getRequiredExperienceYears() != null) {
            req.setRequiredExperienceYears(updated.getRequiredExperienceYears());
        }
        if (updated.getRequiredQualifications() != null) {
            req.setRequiredQualifications(updated.getRequiredQualifications());
        }
        if (updated.getStatus() != null && !updated.getStatus().isBlank()) {
            req.setStatus(updated.getStatus().trim().toUpperCase());
        }

        return requisitionRepository.save(req);
    }

    public void deleteRequisition(Long id) {
        if (requisitionRepository.existsById(id)) {
            // Remove linked applications first
            List<JobApplication> apps = applicationRepository.findByJobRequisitionId(id);
            applicationRepository.deleteAll(apps);
            requisitionRepository.deleteById(id);
        }
    }

    public List<JobApplication> getAllApplications() {
        List<JobApplication> apps = applicationRepository.findAllByOrderByCreatedAtDesc();
        if (apps.isEmpty()) {
            seedInitialApplications();
            apps = applicationRepository.findAllByOrderByCreatedAtDesc();
        }
        return apps;
    }

    public JobApplication applyForJob(Long requisitionId, JobApplication application) {
        JobRequisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid requisition ID"));
        
        List<JobApplication> existingApps = applicationRepository.findByApplicantEmail(application.getApplicantEmail());
        if (existingApps.stream().anyMatch(app -> app.getJobRequisition().getId().equals(requisitionId))) {
            throw new IllegalStateException("Applicant has already applied for this position");
        }

        application.setJobRequisition(requisition);
        if (application.getStatus() == null || application.getStatus().isBlank()) {
            application.setStatus("APPLIED");
        }
        return applicationRepository.save(application);
    }

    public JobApplication updateApplicationStatus(Long applicationId, String status) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid application ID: " + applicationId));
        application.setStatus(status != null ? status.trim().toUpperCase() : "APPLIED");
        return applicationRepository.save(application);
    }

    public void deleteApplication(Long applicationId) {
        if (applicationRepository.existsById(applicationId)) {
            applicationRepository.deleteById(applicationId);
        }
    }

    private void seedInitialRequisitions() {
        Branch branch = branchRepository.findAll().stream().findFirst().orElse(null);

        List<JobRequisition> seeds = List.of(
                JobRequisition.builder()
                        .title("Emergency Department Physician")
                        .department("Emergency")
                        .branch(branch)
                        .vacancyCount(2)
                        .requiredQualifications("MBBS, MD Emergency Medicine with ACLS/ATLS certification")
                        .requiredExperienceYears(5)
                        .minSalary(new BigDecimal("120000"))
                        .maxSalary(new BigDecimal("160000"))
                        .status("POSTED")
                        .build(),
                JobRequisition.builder()
                        .title("Registered Staff Nurse (ICU)")
                        .department("Inpatient Care")
                        .branch(branch)
                        .vacancyCount(4)
                        .requiredQualifications("B.Sc Nursing / GNM with Critical Care certification")
                        .requiredExperienceYears(3)
                        .minSalary(new BigDecimal("45000"))
                        .maxSalary(new BigDecimal("60000"))
                        .status("POSTED")
                        .build(),
                JobRequisition.builder()
                        .title("Senior Clinical Pharmacist")
                        .department("Pharmacy")
                        .branch(branch)
                        .vacancyCount(1)
                        .requiredQualifications("Pharm.D or B.Pharm with Registered Pharmacy Council license")
                        .requiredExperienceYears(4)
                        .minSalary(new BigDecimal("65000"))
                        .maxSalary(new BigDecimal("85000"))
                        .status("POSTED")
                        .build(),
                JobRequisition.builder()
                        .title("Lead Diagnostic Radiologist")
                        .department("Diagnostic Imaging")
                        .branch(branch)
                        .vacancyCount(1)
                        .requiredQualifications("MD Radiodiagnosis with MRI / CT scan expertise")
                        .requiredExperienceYears(6)
                        .minSalary(new BigDecimal("130000"))
                        .maxSalary(new BigDecimal("175000"))
                        .status("POSTED")
                        .build(),
                JobRequisition.builder()
                        .title("Senior Consultant Pediatrician")
                        .department("Pediatrics")
                        .branch(branch)
                        .vacancyCount(2)
                        .requiredQualifications("MD Pediatrics / DCH with Neonatal resuscitation expertise")
                        .requiredExperienceYears(5)
                        .minSalary(new BigDecimal("110000"))
                        .maxSalary(new BigDecimal("150000"))
                        .status("POSTED")
                        .build()
        );

        requisitionRepository.saveAll(seeds);
    }

    private void seedInitialApplications() {
        List<JobRequisition> reqs = requisitionRepository.findAll();
        if (reqs.isEmpty()) {
            seedInitialRequisitions();
            reqs = requisitionRepository.findAll();
        }

        JobRequisition req1 = reqs.size() > 0 ? reqs.get(0) : null;
        JobRequisition req2 = reqs.size() > 1 ? reqs.get(1) : req1;
        JobRequisition req3 = reqs.size() > 2 ? reqs.get(2) : req1;
        JobRequisition req4 = reqs.size() > 3 ? reqs.get(3) : req1;
        JobRequisition req5 = reqs.size() > 4 ? reqs.get(4) : req1;

        if (req1 == null) return;

        List<JobApplication> apps = new ArrayList<>();
        apps.add(JobApplication.builder()
                .jobRequisition(req1)
                .applicantName("Dr. Anita Roy")
                .applicantEmail("anita.roy@medmail.com")
                .applicantPhone("+91 98765 43210")
                .resumeUrl("https://clinic.storage/resumes/anita_roy_cv.pdf")
                .status("INTERVIEW")
                .interviewNotes("[{\"interviewer\":\"Dr. Marcus Vance\",\"score\":\"4.8/5\",\"feedback\":\"Excellent trauma resuscitation knowledge\"}]")
                .build());

        apps.add(JobApplication.builder()
                .jobRequisition(req2)
                .applicantName("Kavita Menon")
                .applicantEmail("k.menon@healthnursing.org")
                .applicantPhone("+91 98765 43211")
                .resumeUrl("https://clinic.storage/resumes/kavita_menon_cv.pdf")
                .status("OFFER")
                .interviewNotes("[{\"interviewer\":\"Elena Rostova\",\"score\":\"4.9/5\",\"feedback\":\"Outstanding critical care and ICU floor skills\"}]")
                .build());

        apps.add(JobApplication.builder()
                .jobRequisition(req3)
                .applicantName("Rahul Sharma")
                .applicantEmail("rahul.s@pharmconnect.in")
                .applicantPhone("+91 98765 43212")
                .resumeUrl("https://clinic.storage/resumes/rahul_sharma_cv.pdf")
                .status("SCREENING")
                .interviewNotes("[{\"interviewer\":\"HR Team\",\"score\":\"4.5/5\",\"feedback\":\"Good drug inventory and clinical dispensing record\"}]")
                .build());

        apps.add(JobApplication.builder()
                .jobRequisition(req4)
                .applicantName("Vikram Joshi")
                .applicantEmail("v.joshi@imagingpro.com")
                .applicantPhone("+91 98765 43213")
                .resumeUrl("https://clinic.storage/resumes/vikram_joshi_cv.pdf")
                .status("INTERVIEW")
                .interviewNotes("[{\"interviewer\":\"Dr. Marcus Vance\",\"score\":\"4.6/5\",\"feedback\":\"Solid PACS and multi-slice CT experience\"}]")
                .build());

        apps.add(JobApplication.builder()
                .jobRequisition(req5)
                .applicantName("Dr. Sneha Patil")
                .applicantEmail("sneha.patil@cliniclabs.com")
                .applicantPhone("+91 98765 43214")
                .resumeUrl("https://clinic.storage/resumes/sneha_patil_cv.pdf")
                .status("HIRED")
                .interviewNotes("[{\"interviewer\":\"Medical Board\",\"score\":\"5.0/5\",\"feedback\":\"Hired as Senior Specialist\"}]")
                .build());

        applicationRepository.saveAll(apps);
    }
}
