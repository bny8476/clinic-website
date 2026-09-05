package com.healthcare.clinic.document.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileUploadSecurityServiceTest {

    private FileUploadSecurityService securityService;

    @BeforeEach
    void setUp() {
        securityService = new FileUploadSecurityService();
    }

    @Test
    void testValidPdfUpload_Succeeds() {
        MockMultipartFile validPdf = new MockMultipartFile(
                "file",
                "patient_report.pdf",
                "application/pdf",
                "PDF Content".getBytes()
        );
        securityService.validateFileUpload(validPdf);
    }

    @Test
    void testValidImageUpload_Succeeds() {
        MockMultipartFile validImage = new MockMultipartFile(
                "file",
                "scan.png",
                "image/png",
                "PNG Content".getBytes()
        );
        securityService.validateFileUpload(validImage);
    }

    @Test
    void testExecutableUpload_ThrowsException() {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/x-msdownload",
                "binary content".getBytes()
        );
        assertThatThrownBy(() -> securityService.validateFileUpload(exeFile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("strictly prohibited");
    }

    @Test
    void testSvgUpload_ThrowsException() {
        MockMultipartFile svgFile = new MockMultipartFile(
                "file",
                "xss.svg",
                "image/svg+xml",
                "<svg onload=alert(1)></svg>".getBytes()
        );
        assertThatThrownBy(() -> securityService.validateFileUpload(svgFile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("strictly prohibited");
    }

    @Test
    void testPathTraversalFilename_SanitizesFilename() {
        String sanitized = securityService.sanitizeFilename("../../../etc/passwd");
        assertThat(sanitized).doesNotContain("/");
        assertThat(sanitized).doesNotContain("..");
    }

    @Test
    void testEmptyFile_ThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);
        assertThatThrownBy(() -> securityService.validateFileUpload(emptyFile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be empty");
    }
}
