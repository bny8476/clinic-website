package com.healthcare.clinic.reception.controller;

import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.reception.entity.QueueToken;
import com.healthcare.clinic.reception.entity.WalkInRegistration;
import com.healthcare.clinic.reception.repository.QueueTokenRepository;
import com.healthcare.clinic.reception.repository.WalkInRegistrationRepository;
import com.healthcare.clinic.nursing.entity.NursePatientAssignment;
import com.healthcare.clinic.nursing.repository.NursePatientAssignmentRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import com.healthcare.clinic.reception.service.QueueTokenService;

@RestController
@RequestMapping("/api/reception")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECEPTION') or hasRole('NURSE') or hasRole('SUPER_ADMIN')")
@Transactional
public class QueueController {

    private final QueueTokenRepository queueTokenRepository;
    private final WalkInRegistrationRepository walkInRegistrationRepository;
    private final BranchRepository branchRepository;
    private final NursePatientAssignmentRepository nursePatientAssignmentRepository;
    private final UserRepository userRepository;
    private final QueueTokenService queueTokenService;

    @PostMapping("/branches/{branchId}/walk-ins")
    public ResponseEntity<WalkInRegistration> registerWalkIn(@PathVariable Long branchId, @RequestBody WalkInRegistration registration) {
        Branch branch = branchRepository.findById(branchId).orElseGet(() -> branchRepository.findFirstByOrderByIdAsc().orElseThrow());
        registration.setBranch(branch);
        registration.setStatus("WAITING");
        
        long count = walkInRegistrationRepository.count() + 1;
        String opNumber = String.format("OP-%s-%05d", LocalDate.now().getYear(), count);
        registration.setOpNumber(opNumber);
        
        WalkInRegistration saved = walkInRegistrationRepository.save(registration);
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_NURSE"))) {
            if (saved.getPatient() != null) {
                User nurse = userRepository.findById(SecurityUtils.getCurrentUserId()).orElseThrow();
                nursePatientAssignmentRepository.save(NursePatientAssignment.builder().nurse(nurse).patient(saved.getPatient()).status("ACTIVE").build());
            }
        }
        
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/branches/{branchId}/walk-ins")
    public ResponseEntity<List<WalkInRegistration>> getWalkIns(@PathVariable Long branchId) {
        Long resolvedBranchId = branchRepository.findById(branchId).map(Branch::getId).orElseGet(() -> branchRepository.findFirstByOrderByIdAsc().map(Branch::getId).orElse(branchId));
        return ResponseEntity.ok(walkInRegistrationRepository.findByBranchIdAndStatus(resolvedBranchId, "WAITING"));
    }

    @PostMapping("/branches/{branchId}/queue/generate")
    public ResponseEntity<QueueToken> generateToken(@PathVariable Long branchId, @RequestParam(required = false) Long walkInId, @RequestParam(required = false) Long appointmentId) {
        Branch branch = branchRepository.findById(branchId).orElseGet(() -> branchRepository.findFirstByOrderByIdAsc().orElseThrow());
        
        WalkInRegistration walkIn = null;
        if (walkInId != null) {
            walkIn = walkInRegistrationRepository.findById(walkInId).orElse(null);
        }
        
        int maxRetries = 3;
        for (int i = 0; i < maxRetries; i++) {
            try {
                QueueToken token = queueTokenService.generateToken(branch, walkIn, appointmentId);
                return ResponseEntity.ok(token);
            } catch (DataIntegrityViolationException e) {
                if (i == maxRetries - 1) {
                    throw e;
                }
                // wait a tiny bit to avoid hammering? or just loop immediately
            }
        }
        
        throw new RuntimeException("Failed to generate queue token after retries");
    }

    @GetMapping("/branches/{branchId}/queue")
    public ResponseEntity<List<QueueToken>> getQueue(@PathVariable Long branchId) {
        Long resolvedBranchId = branchRepository.findById(branchId).map(Branch::getId).orElseGet(() -> branchRepository.findFirstByOrderByIdAsc().map(Branch::getId).orElse(branchId));
        return ResponseEntity.ok(queueTokenRepository.findByBranchIdAndStatusOrderByTokenNumberAsc(resolvedBranchId, "WAITING"));
    }
}
