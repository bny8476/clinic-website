package com.healthcare.clinic.doctor.medicine.entity;

public enum MedicineOrderStatus {
    CREATED,
    PATIENT_REVIEWED,
    CART_ADDED,
    PENDING_PAYMENT,
    PAID,
    PHARMACY_PROCESSING,
    READY_FOR_PICKUP,
    DISPATCHED,
    DELIVERED,
    COMPLETED,
    CANCELLED,
    REFUNDED,
    // Backwards compatibility
    PENDING,
    FULFILLED
}
