package com.healthcare.clinic.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import javax.sql.DataSource;



@Configuration
@ConditionalOnProperty(prefix = "spring.flyway", name = "enabled", matchIfMissing = true)
public class FlywayConfig {

    


    @Bean
    public Flyway clinicFlyway(@Qualifier("clinicDataSource") DataSource clinicDataSource, org.springframework.core.env.Environment env) {
        Flyway flyway = Flyway.configure()
                .dataSource(clinicDataSource)
                .locations("classpath:db/migration/clinic")
                .table("clinic_flyway_schema_history_v2")
                .baselineOnMigrate(true)
                .baselineVersion("114")
                .outOfOrder(true)
                .load();
        
        flyway.migrate();
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
                .outOfOrder(true)
                .load();
        
        flyway.migrate();
        return flyway;
    }
}
