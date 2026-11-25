package com.healthcare.clinic.identity.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordResetDto {
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String newPassword;

    private Boolean notifyUser = true;

    private Boolean mustChangePassword = true;
}
