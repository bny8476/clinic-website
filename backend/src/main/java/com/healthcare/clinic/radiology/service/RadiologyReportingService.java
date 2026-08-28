package com.healthcare.clinic.radiology.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.radiology.entity.DicomStudy;
import com.healthcare.clinic.radiology.entity.ImagingRequest;
import com.healthcare.clinic.radiology.entity.RadiologyReport;
import com.healthcare.clinic.radiology.repository.DicomStudyRepository;
import com.healthcare.clinic.radiology.repository.ImagingRequestRepository;
import com.healthcare.clinic.radiology.repository.RadiologyReportRepository;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
public class RadiologyReportingService {

    private final RadiologyReportRepository reportRepository;
    private final ImagingRequestRepository requestRepository;
    private final DicomStudyRepository studyRepository;
    private final UserRepository userRepository;

    @Transactional
    public RadiologyReport draftReport(Long requestId, String findings, String impression, UserPrincipal radiologistPrincipal) {
        ImagingRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Imaging Request not found: " + requestId));
        
        RadiologyReport report = reportRepository.findByRequestId(requestId).orElse(null);
        
        User radiologist = radiologistPrincipal != null && radiologistPrincipal.getUserId() != null
                ? userRepository.findById(radiologistPrincipal.getUserId()).orElse(null)
                : null;

        if (report == null) {
            DicomStudy study = studyRepository.findByRequestId(requestId).orElse(null);
            
            report = RadiologyReport.builder()
                    .request(request)
                    .radiologist(radiologist)
                    .findings(findings)
                    .impression(impression)
                    .dicomStudyUid(study != null ? study.getStudyInstanceUid() : null)
                    .status("DRAFT")
                    .build();
        } else {
            if ("FINALIZED".equals(report.getStatus()) || "VERIFIED".equals(report.getStatus())) {
                throw new IllegalStateException("Cannot edit a finalized or verified report");
            }
            report.setFindings(findings);
            report.setImpression(impression);
            report.setRadiologist(radiologist);
        }

        return reportRepository.save(report);
    }

    @Transactional
    public RadiologyReport finalizeReport(Long reportId, UserPrincipal radiologistPrincipal) {
        RadiologyReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
        
        User radiologist = radiologistPrincipal != null && radiologistPrincipal.getUserId() != null
                ? userRepository.findById(radiologistPrincipal.getUserId()).orElse(null)
                : null;

        report.setStatus("FINALIZED");
        report.setFinalizedAt(ZonedDateTime.now());
        report.setRadiologist(radiologist);
        
        return reportRepository.save(report);
    }

    @Transactional
    public RadiologyReport verifyReport(Long reportId, UserPrincipal verifierPrincipal) {
        RadiologyReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
        
        if (!"FINALIZED".equals(report.getStatus())) {
            throw new IllegalStateException("Report must be FINALIZED before verification");
        }
        
        User verifier = verifierPrincipal != null && verifierPrincipal.getUserId() != null
                ? userRepository.findById(verifierPrincipal.getUserId()).orElse(null)
                : null;

        report.setStatus("VERIFIED");
        report.setVerifiedAt(ZonedDateTime.now());
        report.setVerifiedBy(verifier);
        
        ImagingRequest request = report.getRequest();
        request.setStatus("VERIFIED");
        requestRepository.save(request);
        
        return reportRepository.save(report);
    }

    @Transactional
    public RadiologyReport releaseReport(Long reportId) {
        RadiologyReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
        
        if (!"VERIFIED".equals(report.getStatus())) {
            throw new IllegalStateException("Report must be VERIFIED before release");
        }
        
        ImagingRequest request = report.getRequest();
        request.setStatus("RELEASED");
        requestRepository.save(request);
        
        return report;
    }
}
