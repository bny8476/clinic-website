package com.healthcare.clinic.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PasswordResetResponseDto {
    private String message;
    private String temporaryPassword;
    private boolean emailSent;
    private boolean mustChangePassword;
}
