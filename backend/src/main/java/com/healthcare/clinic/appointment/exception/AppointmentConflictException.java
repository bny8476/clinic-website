package com.healthcare.clinic.appointment.exception;

import lombok.Getter;

@Getter
public class AppointmentConflictException extends RuntimeException {
    private final String code;

    public AppointmentConflictException(String code, String message) {
        super(message);
        this.code = code;
    }
}
