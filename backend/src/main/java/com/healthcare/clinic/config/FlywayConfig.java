package com.healthcare.clinic.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


import javax.sql.DataSource;



@Configuration
public class FlywayConfig {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public Flyway clinicFlyway(@Qualifier("clinicDataSource") DataSource clinicDataSource, org.springframework.core.env.Environment env) {
        Flyway flyway = Flyway.configure()
                .dataSource(clinicDataSource)
                .locations("classpath:db/migration/clinic")
                .table("clinic_flyway_schema_history_v2")
                .baselineOnMigrate(true)
                .baselineVersion("114")
                .load();
        migrateWithRetry(flyway, "clinic");
        return flyway;
    }

    @Bean
    public Flyway pharmacyFlyway(@Qualifier("pharmacyDataSource") DataSource pharmacyDataSource, org.springframework.core.env.Environment env) {
        Flyway flyway = Flyway.configure()
                .dataSource(pharmacyDataSource)
                .locations("classpath:db/migration/pharmacy")
                .table("pharmacy_flyway_schema_history_v2")
                .baselineOnMigrate(true)
                .baselineVersion("112")
                .load();
        migrateWithRetry(flyway, "pharmacy");
        return flyway;
    }

    private void migrateWithRetry(Flyway flyway, String dbName) {
        int maxAttempts = 5;
        long backoffMs = 2000;
        
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                flyway.migrate();
                return;
            } catch (Exception ex) {
                if (isConnectionError(ex)) {
                    if (attempt == maxAttempts) {
                        logger.error("All {} attempts exhausted for Flyway {} migration. Failing.", maxAttempts, dbName, ex);
                        throw ex;
                    }
                    logger.warn("Connection issue during Flyway {} migration (attempt {}/{}). Retrying in {} ms... Reason: {}", 
                                dbName, attempt, maxAttempts, backoffMs, ex.getMessage());
                    try {
                        Thread.sleep(backoffMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Thread interrupted during Flyway retry sleep", ie);
                    }
                    backoffMs *= 2;
                } else {
                    logger.error("Non-retriable error during Flyway {} migration.", dbName, ex);
                    throw ex;
                }
            }
        }
    }
    
    private boolean isConnectionError(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            String msg = current.getMessage();
            if (msg != null) {
                String lowerMsg = msg.toLowerCase();
                if (lowerMsg.contains("connection is closed") ||
                    lowerMsg.contains("connection refused") ||
                    lowerMsg.contains("connection reset") ||
                    lowerMsg.contains("communications link failure") ||
                    lowerMsg.contains("unable to restore connection to its original state") ||
                    lowerMsg.contains("timed out")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
}
