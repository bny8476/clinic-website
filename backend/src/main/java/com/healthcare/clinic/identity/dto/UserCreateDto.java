package com.healthcare.clinic.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UserCreateDto {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String phone;
    private boolean enabled = true;
    private List<String> roleNames;
    private Long branchId;
    private Long departmentId;

    // Optional doctor profile fields
    private String specialty;
    private String qualifications;
    private java.math.BigDecimal consultationFee;
    private String registrationNumber;
    private Integer experienceYears;
}
