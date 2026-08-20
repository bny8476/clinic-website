package com.healthcare.clinic.config;

import com.healthcare.clinic.identity.entity.Role;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.RoleRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.doctor.entity.DoctorWorkingHours;
import com.healthcare.clinic.doctor.repository.DoctorWorkingHoursRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.tenant.entity.Tenant;
import com.healthcare.clinic.tenant.repository.TenantRepository;
import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

import org.springframework.context.annotation.Profile;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final DoctorProfileRepository doctorProfileRepository;
    private final DoctorWorkingHoursRepository doctorWorkingHoursRepository;
    private final TenantRepository tenantRepository;
    private final BranchRepository branchRepository;

    @Value("${SEED_ADMIN_PASSWORD:CHANGE_ME_ADMIN}")
    private String seedAdminPassword;

    @Value("${SEED_DOCTOR_PASSWORD:CHANGE_ME_DOCTOR}")
    private String seedDoctorPassword;

    @Override
    public void run(String... args) throws Exception {
        validateSeedPassword("SEED_ADMIN_PASSWORD", seedAdminPassword);
        validateSeedPassword("SEED_DOCTOR_PASSWORD", seedDoctorPassword);

        String[] allRoleNames = {
            "ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_SYSTEM_ADMIN", "ROLE_BRANCH_ADMIN",
            "ROLE_DOCTOR", "ROLE_PATIENT", "ROLE_PHARMACIST", "ROLE_NURSE",
            "ROLE_LAB", "ROLE_LAB_TECH", "ROLE_PATHOLOGIST", "ROLE_LAB_SENIOR",
            "ROLE_RADIOLOGIST", "ROLE_RECEPTION", "ROLE_FINANCE", "ROLE_ACCOUNTANT",
            "ROLE_INVENTORY_MANAGER", "ROLE_MARKETING", "ROLE_STORE_MANAGER", "ROLE_SUPPORT",
            "ROLE_CUSTOMER_SUPPORT", "ROLE_VENDOR", "ROLE_INSURANCE", "ROLE_AMBULANCE", "ROLE_HR"
        };

        Set<Role> adminRoles = new HashSet<>();
        for (String roleName : allRoleNames) {
            Role role = roleRepository.findByName(roleName).orElseGet(() -> {
                Role newRole = Role.builder().name(roleName).build();
                newRole.setLoginPortal(getLoginPortalForRole(roleName));
                return roleRepository.save(newRole);
            });
            adminRoles.add(role);
        }

        // Seed Tenant
        Tenant tenant = tenantRepository.findById(1L).orElseGet(() -> {
            Tenant newTenant = Tenant.builder().name("Main Healthcare Group").email("admin@main.clinic.com").status("ACTIVE").build();
            return tenantRepository.save(newTenant);
        });

        // Seed Branch
        Branch branch = branchRepository.findById(1L).orElseGet(() -> {
            Branch newBranch = Branch.builder().tenant(tenant).name("Main Clinic Branch").address("123 Health Ave").city("City").state("State").country("Country").postalCode("12345").timezone("UTC").isActive(true).build();
            return branchRepository.save(newBranch);
        });

        seedUser("superadmin@clinic.com", "Clinic@2026#Super", "Super", "Admin", Set.of("ROLE_SUPER_ADMIN"));
        
        User admin = seedUser("admin@clinic.com", "Clinic@2026#Admin", "Admin", "User", null);
        admin.setRoles(adminRoles);
        userRepository.save(admin);

        seedUser("manager@clinic.com", "Clinic@2026#Manager", "Manager", "User", Set.of("ROLE_BRANCH_ADMIN"));
        
        User doctor = seedUser("doctor@clinic.com", "Clinic@2026#Doctor", "John", "Doe", Set.of("ROLE_DOCTOR"));
        
        // Ensure the seeded doctor has a DoctorProfile so the dashboard loads
        if (doctorProfileRepository.findByUserId(doctor.getId()).isEmpty()) {
            DoctorProfile profile = DoctorProfile.builder()
                    .userId(doctor.getId())
                    .specialty("General Medicine")
                    .qualifications("MBBS, MD")
                    .experienceYears(5)
                    .consultationFee(new java.math.BigDecimal("500.00"))
                    .bio("Experienced general practitioner with a focus on preventive care.")
                    .isActive(true)
                    .branchId(1L)
                    .build();
            doctorProfileRepository.save(profile);
            log.info("DataSeeder: created default DoctorProfile for doctor@clinic.com.");
        }
        
        DoctorProfile savedProfile = doctorProfileRepository.findByUserId(doctor.getId()).orElse(null);
        if (savedProfile != null && doctorWorkingHoursRepository.findByDoctorIdAndIsActiveTrue(savedProfile.getId()).isEmpty()) {
            for (int day = 1; day <= 5; day++) { // Monday to Friday
                DoctorWorkingHours hours = DoctorWorkingHours.builder()
                        .doctor(savedProfile)
                        .dayOfWeek(day)
                        .startTime(java.time.LocalTime.of(9, 0))
                        .endTime(java.time.LocalTime.of(17, 0))
                        .slotDurationMinutes(20)
                        .isActive(true)
                        .branchId(savedProfile.getBranchId())
                        .createdAt(java.time.Instant.now())
                        .updatedAt(java.time.Instant.now())
                        .build();
                doctorWorkingHoursRepository.save(hours);
            }
            log.info("DataSeeder: created default DoctorWorkingHours for doctor@clinic.com.");
        }

        seedUser("nurse@clinic.com", "Clinic@2026#Nurse", "Jane", "Smith", Set.of("ROLE_NURSE"));
        seedUser("receptionist@clinic.com", "Clinic@2026#Reception", "Rec", "Eptionist", Set.of("ROLE_RECEPTION"));
        seedUser("labtech@clinic.com", "Clinic@2026#LabTech", "Lab", "Tech", Set.of("ROLE_LAB_TECH"));
        seedUser("radiologist@clinic.com", "Clinic@2026#Radio", "Radio", "Logist", Set.of("ROLE_RADIOLOGIST"));
        seedUser("pharmacist@clinic.com", "Clinic@2026#Pharmacy", "Pharma", "Cist", Set.of("ROLE_PHARMACIST"));
        seedUser("pharmacymanager@clinic.com", "Clinic@2026#PharmMgr", "Pharma", "Manager", Set.of("ROLE_PHARMACIST", "ROLE_INVENTORY_MANAGER"));
        seedUser("accountant@clinic.com", "Clinic@2026#Account", "Acc", "Ountant", Set.of("ROLE_ACCOUNTANT"));
        seedUser("hrmanager@clinic.com", "Clinic@2026#HR", "HR", "Manager", Set.of("ROLE_HR"));
        seedUser("staff@clinic.com", "Clinic@2026#Staff", "Staff", "User", Set.of("ROLE_SUPPORT"));
        seedUser("patient@clinic.com", "Clinic@2026#Patient", "Pat", "Ient", Set.of("ROLE_PATIENT"));
    }

    private User seedUser(String email, String password, String firstName, String lastName, Set<String> roleNames) {
        User user = userRepository.findByEmail(email).orElseGet(() -> 
            User.builder().email(email).firstName(firstName).lastName(lastName).build()
        );
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setEnabled(true);

        Set<Role> roles = new HashSet<>();
        if (roleNames != null) {
            for (String roleName : roleNames) {
                roleRepository.findByName(roleName).ifPresent(roles::add);
            }
        }
        user.setRoles(roles);
        User savedUser = userRepository.save(user);
        log.info("DataSeeder: synced {} credentials and roles.", email);
        return savedUser;
    }

    private void validateSeedPassword(String envVarName, String value) {
        if (value == null || value.trim().isEmpty() || value.startsWith("CHANGE_ME")) {
            throw new IllegalStateException(
                "Refusing to start: " + envVarName + " is not configured. " +
                "Set a strong password in your .env file before running the application."
            );
        }
    }

    private String getLoginPortalForRole(String roleName) {
        return switch (roleName) {
            case "ROLE_PATIENT" -> "patient";
            case "ROLE_DOCTOR" -> "doctor";
            case "ROLE_ADMIN", "ROLE_SYSTEM_ADMIN", "ROLE_SUPER_ADMIN" -> "admin";
            case "ROLE_BRANCH_ADMIN" -> "branch-admin";
            case "ROLE_NURSE" -> "nurse";
            case "ROLE_RECEPTION" -> "reception";
            case "ROLE_PHARMACIST" -> "pharmacy";
            case "ROLE_LAB_TECH", "ROLE_LAB", "ROLE_PATHOLOGIST", "ROLE_LAB_SENIOR" -> "lab";
            case "ROLE_RADIOLOGIST" -> "radiologist";
            case "ROLE_ACCOUNTANT" -> "accountant";
            case "ROLE_FINANCE" -> "finance";
            case "ROLE_INVENTORY_MANAGER", "ROLE_STORE_MANAGER" -> "inventory";
            case "ROLE_MARKETING" -> "marketing";
            case "ROLE_SUPPORT", "ROLE_CUSTOMER_SUPPORT" -> "customer-support";
            case "ROLE_VENDOR" -> "vendor";
            case "ROLE_INSURANCE" -> "insurance";
            case "ROLE_AMBULANCE" -> "ambulance";
            case "ROLE_HR" -> "hr";
            default -> null;
        };
    }
}
