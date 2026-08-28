package com.healthcare.clinic.inpatient.controller;

import com.healthcare.clinic.audit.annotation.AuditableAction;
import com.healthcare.clinic.security.UserPrincipal;
import com.healthcare.clinic.inpatient.entity.Bed;
import com.healthcare.clinic.inpatient.entity.Room;
import com.healthcare.clinic.inpatient.entity.Ward;
import com.healthcare.clinic.inpatient.service.BedManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inpatient")
@RequiredArgsConstructor
public class BedManagementController {

    private final BedManagementService bedManagementService;

    @GetMapping("/wards")
    public ResponseEntity<List<Ward>> getWards(@AuthenticationPrincipal UserPrincipal user) {
        Long branchId = user != null ? user.getBranchId() : null;
        return ResponseEntity.ok(bedManagementService.getWards(branchId));
    }

    @GetMapping("/beds")
    public ResponseEntity<List<Bed>> getBeds(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserPrincipal user) {
        Long branchId = user != null ? user.getBranchId() : null;
        return ResponseEntity.ok(bedManagementService.getBeds(branchId, status));
    }

    @PostMapping("/wards")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    @AuditableAction(module = "INPATIENT", action = "CREATE_WARD")
    public ResponseEntity<Ward> createWard(@RequestBody Ward ward, @AuthenticationPrincipal UserPrincipal user) {
        if (user != null) {
            ward.setBranchId(user.getBranchId());
        }
        return ResponseEntity.ok(bedManagementService.createWard(ward));
    }

    @PostMapping("/rooms")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    @AuditableAction(module = "INPATIENT", action = "CREATE_ROOM")
    public ResponseEntity<Room> createRoom(@RequestBody Room room) {
        return ResponseEntity.ok(bedManagementService.createRoom(room));
    }

    @PostMapping("/beds")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    @AuditableAction(module = "INPATIENT", action = "CREATE_BED")
    public ResponseEntity<Bed> createBed(@RequestBody Bed bed) {
        return ResponseEntity.ok(bedManagementService.createBed(bed));
    }
}
