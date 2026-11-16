package com.healthcare.clinic.document.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * S3StorageServiceImpl - STUBBED (AWS S3 SDK removed for Render deployment).
 * This bean is conditional on storage.provider=s3 and will NOT load in the
 * render profile (storage.provider defaults to local/unset).
 * Re-enable by restoring software.amazon.awssdk:s3 dependency and AwsConfig beans.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "storage.provider", havingValue = "s3")
public class S3StorageServiceImpl implements DocumentStorageService {

    @Override
    public String uploadFile(MultipartFile file) {
        log.warn("[STUB] S3StorageServiceImpl - AWS S3 removed. Upload is a no-op. file={}", file.getOriginalFilename());
        return "stub-key-" + file.getOriginalFilename();
    }

    @Override
    public InputStream downloadFile(String storageKey) {
        log.warn("[STUB] S3StorageServiceImpl - AWS S3 removed. Download returns null. key={}", storageKey);
        return null;
    }

    @Override
    public String generateDownloadUrl(String storageKey) {
        log.warn("[STUB] S3StorageServiceImpl - AWS S3 removed. URL generation returns placeholder. key={}", storageKey);
        return "/documents/disabled?key=" + storageKey;
    }

    @Override
    public void deleteFile(String storageKey) {
        log.warn("[STUB] S3StorageServiceImpl - AWS S3 removed. Delete is a no-op. key={}", storageKey);
    }
}