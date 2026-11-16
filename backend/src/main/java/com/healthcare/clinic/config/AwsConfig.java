package com.healthcare.clinic.config;

import org.springframework.context.annotation.Configuration;

/**
 * AwsConfig - STUBBED (AWS SDK removed for Render deployment).
 * S3Client and S3Presigner beans are not registered; storage.provider must
 * NOT be set to "s3" in the active profile.
 * S3StorageServiceImpl is also @ConditionalOnProperty(storage.provider=s3) so it
 * will not load either.
 * Re-enable by restoring software.amazon.awssdk:s3 dependency and the original bean definitions.
 */
@Configuration
public class AwsConfig {
    // AWS beans intentionally removed - AWS SDK dependency has been removed.
    // See application-render.yml: storage.provider=local (default)
}