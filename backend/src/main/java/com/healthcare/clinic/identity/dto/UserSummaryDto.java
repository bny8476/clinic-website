package com.healthcare.clinic.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    private Long id;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    private String phone;
    private boolean enabled;
    private List<String> roleNames;
    private Long branchId;
    private String branchName;
    private Long departmentId;
    private String departmentName;
    private java.time.ZonedDateTime createdAt;
    private java.time.ZonedDateTime lastLogin;
    private List<String> permissions;
}
