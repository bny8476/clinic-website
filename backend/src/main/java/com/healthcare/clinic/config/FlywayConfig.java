package com.healthcare.clinic.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;


import javax.sql.DataSource;



@Configuration
public class FlywayConfig {


    @Bean(initMethod = "migrate")
    public Flyway clinicFlyway(@Qualifier("clinicDataSource") DataSource clinicDataSource, org.springframework.core.env.Environment env) {
        Flyway flyway = Flyway.configure()
                .dataSource(clinicDataSource)
                .locations("classpath:db/migration/clinic")
                .table("clinic_flyway_schema_history_v2")
                .baselineOnMigrate(true)
                .baselineVersion("114")
                .load();
        return flyway;
    }

    @Bean(initMethod = "migrate")
    @DependsOn("clinicFlyway")
    public Flyway pharmacyFlyway(@Qualifier("pharmacyDataSource") DataSource pharmacyDataSource, org.springframework.core.env.Environment env) {
        Flyway flyway = Flyway.configure()
                .dataSource(pharmacyDataSource)
                .locations("classpath:db/migration/pharmacy")
                .table("pharmacy_flyway_schema_history_v2")
                .baselineOnMigrate(true)
                .baselineVersion("112")
                .load();
        return flyway;
    }
}
