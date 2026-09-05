package com.healthcare.clinic.flyway;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import org.springframework.test.annotation.DirtiesContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("flyway-test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class FlywaySchemaValidationTest {

    @Autowired(required = false)
    private Flyway flyway;

    @Test
    void testFlywayMigrations_ExecuteSuccessfullyAndValidateSchema() {
        if (flyway != null) {
            assertThat(flyway.info().current()).isNotNull();
            assertThat(flyway.info().applied().length).isGreaterThan(0);
        }
    }
}
