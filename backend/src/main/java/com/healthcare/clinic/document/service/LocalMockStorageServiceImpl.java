package com.healthcare.clinic.document.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@ConditionalOnProperty(name = "storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalMockStorageServiceImpl implements DocumentStorageService {

    // Using an in-memory map to simulate file storage since local disk won't survive Render redeploys.
    // In a real production system, this class would be replaced by S3StorageServiceImpl.
    private final ConcurrentHashMap<String, byte[]> mockStorage = new ConcurrentHashMap<>();

    @Override
    public String uploadFile(MultipartFile file) {
        String storageKey = UUID.randomUUID().toString() + "-" + file.getOriginalFilename();
        try {
            mockStorage.put(storageKey, file.getBytes());
            log.info("Mock upload: saved file {} with key {}", file.getOriginalFilename(), storageKey);
            return storageKey;
        } catch (IOException e) {
            throw new RuntimeException("Failed to read multipart file", e);
        }
    }

    @Override
    public InputStream downloadFile(String storageKey) {
        byte[] data = mockStorage.get(storageKey);
        if (data == null) {
            throw new RuntimeException("File not found in mock storage: " + storageKey);
        }
        return new ByteArrayInputStream(data);
    }

    @Override
    public String generateDownloadUrl(String storageKey) {
        // Mock implementation just returns a local API route that would fetch the file
        return "/api/documents/download/" + storageKey;
    }

    @Override
    public void deleteFile(String storageKey) {
        mockStorage.remove(storageKey);
        log.info("Mock delete: removed file with key {}", storageKey);
    }
}
