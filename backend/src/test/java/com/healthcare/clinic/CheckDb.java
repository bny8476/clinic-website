package com.healthcare.clinic;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckDb {
    @Test
    public void runFlywayMigrate() throws Exception {
        String url = "jdbc:postgresql://pg-2ec02a9b-eakhalaivanp-46d0.i.aivencloud.com:15783/defaultdb?sslmode=require";
        String user = "avnadmin";
        String password = System.getenv("AIVEN_DB_PASSWORD");
        
        System.out.println("\n\n--- RUNNING FLYWAY MIGRATE ---");
        Flyway flyway = Flyway.configure()
            .dataSource(url, user, password)
            .locations("classpath:db/migration/clinic", "classpath:db/migration/pharmacy")
            .table("clinic_flyway_schema_history_v2")
            .baselineOnMigrate(false)
            .baselineVersion("0")
            .validateOnMigrate(false)
            .outOfOrder(true)
            .load();
            
        flyway.migrate();
        
        System.out.println("\n--- FLYWAY INSTANCE INFO ---");
        for (MigrationInfo info : flyway.info().all()) {
            if (info.getVersion() != null && info.getVersion().getVersion().startsWith("132")) {
                System.out.printf("%s | %s | %s | %s | %s%n",
                    info.getVersion(),
                    info.getDescription(),
                    info.getType(),
                    info.getState(),
                    info.getScript()
                );
            }
        }
        System.out.println("------------------------\n\n");
    }
}
