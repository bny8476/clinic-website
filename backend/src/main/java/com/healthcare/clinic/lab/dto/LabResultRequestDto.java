package com.healthcare.clinic.lab.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class LabResultRequestDto {
    private String resultValue;
    private String referenceRange;
    private String unit;
    private Boolean isAbnormal;
    private Boolean isCritical;
    private Boolean isDraft;
    private String technicalComments;
}
