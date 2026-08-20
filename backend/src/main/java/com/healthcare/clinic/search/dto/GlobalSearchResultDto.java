package com.healthcare.clinic.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalSearchResultDto {
    private Long id;
    private String type;
    private String title;
    private String subtitle;
    private String icon;
}
