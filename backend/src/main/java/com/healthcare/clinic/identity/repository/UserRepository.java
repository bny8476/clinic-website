package com.healthcare.clinic.identity.repository;

import com.healthcare.clinic.identity.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);

    @Query("SELECT DISTINCT u FROM User u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(:identifier)) OR u.phoneNumber = TRIM(:identifier)")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(u.lastName)  LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(u.email)     LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "u.phoneNumber      LIKE CONCAT('%',:q,'%')")
    Page<User> searchByNameOrEmail(@Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(:email)) OR u.phoneNumber = TRIM(:email)")
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.enabled = true")
    java.util.List<User> findUsersByRoleName(@Param("roleName") String roleName);
    
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN u.roles r WHERE " +
           "(:q IS NULL OR :q = '' OR LOWER(u.firstName) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(u.lastName) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%',:q,'%')) OR u.phoneNumber LIKE CONCAT('%',:q,'%')) AND " +
           "(:roleName IS NULL OR :roleName = '' OR r.name = :roleName OR r.name = CONCAT('ROLE_', :roleName)) AND " +
           "(:branchId IS NULL OR u.branchId = :branchId) AND " +
           "(:departmentId IS NULL OR u.departmentId = :departmentId) AND " +
           "(:enabled IS NULL OR u.enabled = :enabled)")
    Page<User> findUsersFiltered(@Param("q") String q,
                                 @Param("roleName") String roleName,
                                 @Param("branchId") Long branchId,
                                 @Param("departmentId") Long departmentId,
                                 @Param("enabled") Boolean enabled,
                                 Pageable pageable);

    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles r WHERE (r.name = :roleName OR r.name = CONCAT('ROLE_', :roleName)) AND u.enabled = true")
    long countByRolesName(@Param("roleName") String roleName);
    
    long countByEnabledTrue();
    long countByEnabledFalse();
}
