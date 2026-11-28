package com.healthcare.clinic.radiology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DicomStudyMetadataDto {
    private String studyInstanceUid;
    private String accessionNumber;
    private String patientName;
    private String patientId;
    private String modality;
    private String procedureName;
    private String studyDate;
    private int sliceCount;
    private int seriesCount;
    private String viewerUrl;
    private Map<String, Object> tags;
    private List<Map<String, Object>> series;
}
