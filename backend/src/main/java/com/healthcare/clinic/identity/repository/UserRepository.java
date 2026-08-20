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

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(u.lastName)  LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(u.email)     LIKE LOWER(CONCAT('%',:q,'%'))")
    Page<User> searchByNameOrEmail(@Param("q") String q, Pageable pageable);

    @Query("SELECT u FROM User u JOIN FETCH u.roles WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.enabled = true")
    java.util.List<User> findUsersByRoleName(@Param("roleName") String roleName);
    
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.enabled = true")
    long countByRolesName(@Param("roleName") String roleName);
    
    long countByEnabledTrue();
    long countByEnabledFalse();
}
