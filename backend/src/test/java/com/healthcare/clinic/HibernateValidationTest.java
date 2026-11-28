package com.healthcare.clinic;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
public class HibernateValidationTest {

    @Test
    void contextLoads() {
        // Just checking if Hibernate validates correctly on startup
    }
}
