package com.healthcare.clinic.reception.controller;

import com.healthcare.clinic.notification.event.QueueTokenCalledEvent;
import com.healthcare.clinic.reception.entity.QueueToken;
import com.healthcare.clinic.reception.entity.QueueTransfer;
import com.healthcare.clinic.reception.repository.QueueTokenRepository;
import com.healthcare.clinic.reception.repository.QueueTransferRepository;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reception/queue")
@RequiredArgsConstructor
public class QueueManagementController {

    private final QueueTokenRepository queueTokenRepository;
    private final QueueTransferRepository queueTransferRepository;
    private final ApplicationEventPublisher eventPublisher;

    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<QueueToken>> getQueueForBranch(@PathVariable Long branchId) {
        java.time.ZonedDateTime startOfDay = java.time.ZonedDateTime.now().toLocalDate().atStartOfDay(java.time.ZoneId.systemDefault());
        return ResponseEntity.ok(queueTokenRepository.findByBranchIdAndGeneratedAtAfterOrderByPriorityLevelDescTokenNumberAsc(branchId, startOfDay));
    }

    @PostMapping("/{tokenId}/transfer")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE')")
    public ResponseEntity<QueueTransfer> transferToken(
            @PathVariable Long tokenId,
            @RequestBody Map<String, Object> request) {
        
        QueueToken token = queueTokenRepository.findById(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Token not found with ID: " + tokenId));
                
        Long fromDoctorId = request.containsKey("fromDoctorId") && request.get("fromDoctorId") != null ? Long.valueOf(request.get("fromDoctorId").toString()) : null;
        Long toDoctorId = request.containsKey("toDoctorId") && request.get("toDoctorId") != null ? Long.valueOf(request.get("toDoctorId").toString()) : null;
        String reason = (String) request.get("reason");
        String department = (String) request.get("department");

        QueueTransfer transfer = QueueTransfer.builder()
                .tokenId(tokenId)
                .fromDoctorId(fromDoctorId)
                .toDoctorId(toDoctorId)
                .reason(reason)
                .transferredByUserId(SecurityUtils.getCurrentUserId())
                .build();
                
        if (department != null) {
            token.setCurrentDepartment(department);
            queueTokenRepository.save(token);
        }

        return ResponseEntity.ok(queueTransferRepository.save(transfer));
    }

    @PutMapping("/{tokenId}/status")
    @PreAuthorize("hasAuthority('ROLE_RECEPTION') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_NURSE') or hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<QueueToken> updateTokenStatus(
            @PathVariable Long tokenId,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) Map<String, String> request) {
        QueueToken token = queueTokenRepository.findById(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Token not found with ID: " + tokenId));
                
        String finalStatus = status;
        if ((finalStatus == null || finalStatus.trim().isEmpty()) && request != null) {
            finalStatus = request.get("status");
        }
        if (finalStatus == null || finalStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }
        
        token.setStatus(finalStatus.trim().toUpperCase());
        QueueToken saved = queueTokenRepository.save(token);

        if ("IN_PROGRESS".equalsIgnoreCase(finalStatus) || "CALLED".equalsIgnoreCase(finalStatus)) {
            try {
                if (eventPublisher != null) {
                    Long patientUserId = null;
                    if (saved.getAppointment() != null && saved.getAppointment().getPatient() != null) {
                        patientUserId = saved.getAppointment().getPatient().getUserId();
                    }
                    eventPublisher.publishEvent(QueueTokenCalledEvent.builder()
                            .tokenId(saved.getId())
                            .branchId(saved.getBranch() != null ? saved.getBranch().getId() : null)
                            .branchName(saved.getBranch() != null ? saved.getBranch().getName() : null)
                            .tokenNumber(saved.getTokenNumber() != null ? saved.getTokenNumber() : 0)
                            .patientUserId(patientUserId)
                            .patientEmail(null)
                            .build());
                }
            } catch (Exception e) {
                // non-blocking event publish
            }
        }

        return ResponseEntity.ok(saved);
    }
}
