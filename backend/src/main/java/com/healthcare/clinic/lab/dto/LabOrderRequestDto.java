package com.healthcare.clinic.lab.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class LabOrderRequestDto {
    private Long patientId;
    private Long testCatalogId;
    private List<Long> testIds; // For multi-test panel orders
    private String priority; // ROUTINE, URGENT, STAT
    private String clinicalNotes;
    private Long branchId;
}
