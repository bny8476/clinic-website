package com.healthcare.clinic.nursing.service;

import com.healthcare.clinic.identity.entity.Role;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.RoleRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.inpatient.entity.Bed;
import com.healthcare.clinic.nursing.entity.BedAssignment;
import com.healthcare.clinic.inpatient.entity.Ward;
import com.healthcare.clinic.nursing.entity.WardTransfer;
import com.healthcare.clinic.nursing.repository.BedAssignmentRepository;
import com.healthcare.clinic.nursing.repository.BedRepository;
import com.healthcare.clinic.nursing.repository.WardRepository;
import com.healthcare.clinic.nursing.repository.WardTransferRepository;
import com.healthcare.clinic.security.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BedManagementIntegrationTest {

    @Autowired
    private BedManagementService bedManagementService;

    @Autowired
    private WardTransferService wardTransferService;

    @Autowired
    private WardRepository wardRepository;

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private BedAssignmentRepository bedAssignmentRepository;

    @Autowired
    private WardTransferRepository wardTransferRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private User nurseUser;
    private Ward ward;
    private Bed bed1;
    private Bed bed2;
    private MockedStatic<SecurityUtils> mockedSecurityUtils;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @BeforeEach
    void setUp() {
        Role chargeNurseRole = roleRepository.findByName("ROLE_CHARGE_NURSE")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName("ROLE_CHARGE_NURSE");
                    return roleRepository.save(r);
                });

        nurseUser = new User();
        nurseUser.setFirstName("Test");
        nurseUser.setLastName("Nurse");
        nurseUser.setEmail("nurse@test.com");
        nurseUser.setPasswordHash("password");
        nurseUser.setRoles(Set.of(chargeNurseRole));
        userRepository.save(nurseUser);

        mockedSecurityUtils = Mockito.mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(nurseUser.getId());

        ward = Ward.builder()
                .branchId(1L)
                .name("General Ward A")
                .wardType("GENERAL")
                .capacity(10)
                .build();
        wardRepository.save(ward);

        try {
            entityManager.createNativeQuery("INSERT INTO rooms (id, room_number, ward_id, room_type, capacity) VALUES (1, '101', :wardId, 'GENERAL', 2)")
                .setParameter("wardId", ward.getId())
                .executeUpdate();
        } catch (Exception e) {
            System.err.println("Failed to insert room: " + e.getMessage());
        }

        com.healthcare.clinic.inpatient.entity.Room room = entityManager.find(com.healthcare.clinic.inpatient.entity.Room.class, 1L);

        bed1 = Bed.builder()
                .room(room)
                .bedNumber("A-01")
                .build();
        bed1 = bedRepository.save(bed1);

        bed2 = Bed.builder()
                .room(room)
                .bedNumber("A-02")
                .build();
        bed2 = bedRepository.save(bed2);
    }

    @AfterEach
    void tearDown() {
        if (mockedSecurityUtils != null) {
            mockedSecurityUtils.close();
        }
    }

    @Test
    void testAssignBedAndDischarge() {
        // Assign bed
        BedAssignment assignment = bedManagementService.assignBed(bed1.getId(), 100L, 200L, "Admission");
        assertNotNull(assignment.getId());
        assertEquals("ACTIVE", assignment.getStatus());

        Bed updatedBed = bedRepository.findById(bed1.getId()).orElseThrow();
        assertEquals("OCCUPIED", updatedBed.getStatus());

        // Attempt double booking
        assertThrows(IllegalStateException.class, () -> 
            bedManagementService.assignBed(bed1.getId(), 101L, 201L, "Double Booking")
        );

        // Discharge
        BedAssignment discharged = bedManagementService.dischargePatientFromBed(assignment.getId());
        assertEquals("DISCHARGED", discharged.getStatus());
        assertNotNull(discharged.getDischargedAt());

        updatedBed = bedRepository.findById(bed1.getId()).orElseThrow();
        assertEquals("CLEANING", updatedBed.getStatus());
    }

    @Test
    void testWardTransferWorkflow() {
        // Initial assignment
        BedAssignment assignment = bedManagementService.assignBed(bed1.getId(), 100L, 200L, "Admission");

        // Request transfer
        WardTransfer transfer = wardTransferService.requestTransfer(100L, 200L, bed2.getId(), "ROUTINE", "Step down");
        assertNotNull(transfer.getId());
        assertEquals("REQUESTED", transfer.getStatus());

        // Approve transfer
        transfer = wardTransferService.approveTransfer(transfer.getId(), null);
        assertEquals("APPROVED", transfer.getStatus());
        assertEquals("RESERVED", bedRepository.findById(bed2.getId()).orElseThrow().getStatus());

        // Complete transfer
        transfer = wardTransferService.completeTransfer(transfer.getId());
        assertEquals("COMPLETED", transfer.getStatus());

        // Verify source bed is CLEANING and assignment is TRANSFERRED
        Bed sourceBed = bedRepository.findById(bed1.getId()).orElseThrow();
        assertEquals("CLEANING", sourceBed.getStatus());
        BedAssignment oldAssignment = bedAssignmentRepository.findById(assignment.getId()).orElseThrow();
        assertEquals("TRANSFERRED", oldAssignment.getStatus());

        // Verify dest bed is OCCUPIED and new assignment is ACTIVE
        Bed destBed = bedRepository.findById(bed2.getId()).orElseThrow();
        assertEquals("OCCUPIED", destBed.getStatus());
        
        var activeAssignments = bedAssignmentRepository.findByPatientIdAndStatus(100L, "ACTIVE");
        assertEquals(1, activeAssignments.size());
        assertEquals(bed2.getId(), activeAssignments.get(0).getBedId());
    }
}
