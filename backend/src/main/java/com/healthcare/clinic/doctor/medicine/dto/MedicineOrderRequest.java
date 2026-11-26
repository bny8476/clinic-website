package com.healthcare.clinic.doctor.medicine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineOrderRequest {
    private Long doctorId;
    private List<MedicineCartItemDto> items;
    
    // Patient Delivery & Payment Details
    private String patientName;
    private String contactPhone;
    private String deliveryAddress;
    private String deliveryCity;
    private String deliveryPincode;
    private String deliveryNotes;
    private String paymentMethod;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String prescriptionUrl;
}
