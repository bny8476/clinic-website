package com.healthcare.clinic.doctor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * VoiceToTextService - STUBBED (AWS Transcribe SDK removed for Render deployment).
 * Returns a mock transcript. Re-enable by restoring software.amazon.awssdk:transcribe
 * and software.amazon.awssdk:s3 dependencies and the original implementation.
 */
@Service
@Slf4j
public class VoiceToTextService {

    public String transcribe(MultipartFile audioFile) {
        log.info("[STUB] VoiceToTextService - AWS Transcribe removed. Returning mock transcript. file={}", audioFile.getOriginalFilename());
        return "Patient presents with a 3-day history of productive cough, fever, and chills. " +
               "Denies shortness of breath. Past medical history significant for asthma. " +
               "[Note: Transcription service is disabled in this deployment]";
    }
}