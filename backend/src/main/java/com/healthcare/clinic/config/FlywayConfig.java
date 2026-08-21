package com.healthcare.clinic.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@ConditionalOnProperty(prefix = "spring.flyway", name = "enabled", matchIfMissing = true)
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    private boolean isMySql(org.springframework.core.env.Environment env, String prefix) {
        String driver = env.getProperty(prefix + ".driver-class-name", "");
        String url = env.getProperty(prefix + ".jdbc-url", "");
        String url2 = env.getProperty(prefix + ".url", "");
        return driver.contains("mysql") || url.startsWith("jdbc:mysql") || url2.startsWith("jdbc:mysql");
    }

    @Bean
    public Flyway clinicFlyway(@Qualifier("clinicDataSource") DataSource clinicDataSource, org.springframework.core.env.Environment env) {
        Flyway flyway = Flyway.configure()
                .dataSource(clinicDataSource)
                .locations("classpath:db/migration/clinic")
                .table("clinic_flyway_schema_history_v2")
                .baselineOnMigrate(true)
                .baselineVersion("114")
                .ignoreMigrationPatterns("*:missing", "*:ignored", "*:pending")
                .load();
        
        if (isMySql(env, "spring.datasource.clinic")) {
            log.warn("Skipping Clinic Flyway migration for MySQL/TiDB - relying on Hibernate auto-ddl");
        } else {
            flyway.migrate();
        }
        return flyway;
    }

    @Bean
    @DependsOn("clinicFlyway")
    public Flyway pharmacyFlyway(@Qualifier("pharmacyDataSource") DataSource pharmacyDataSource, org.springframework.core.env.Environment env) {
        Flyway flyway = Flyway.configure()
                .dataSource(pharmacyDataSource)
                .locations("classpath:db/migration/pharmacy")
                .table("pharmacy_flyway_schema_history_v2")
                .baselineOnMigrate(true)
                .baselineVersion("112")
                .ignoreMigrationPatterns("*:missing", "*:ignored", "*:pending")
                .load();
        
        if (isMySql(env, "spring.datasource.pharmacy")) {
            log.warn("Skipping Pharmacy Flyway migration for MySQL/TiDB - relying on Hibernate auto-ddl");
        } else {
            flyway.migrate();
        }
        return flyway;
    }
}
