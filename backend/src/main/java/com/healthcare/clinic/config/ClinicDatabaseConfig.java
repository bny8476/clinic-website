package com.healthcare.clinic.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.context.annotation.DependsOn;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.healthcare.clinic",
        entityManagerFactoryRef = "clinicEntityManagerFactory",
        transactionManagerRef = "clinicTransactionManager",
        nameGenerator = org.springframework.context.annotation.FullyQualifiedAnnotationBeanNameGenerator.class
)
public class ClinicDatabaseConfig {

    @Autowired
    private org.springframework.core.env.Environment environment;

    @Primary
    @Bean(name = "clinicDataSource")
    @ConfigurationProperties(prefix = "app.datasource.clinic")
    public DataSource dataSource() {
        String url = environment.getProperty("app.datasource.clinic.url");
        if (url == null || url.trim().isEmpty()) {
            url = environment.getProperty("SPRING_DATASOURCE_CLINIC_URL");
        }
        
        String username = environment.getProperty("app.datasource.clinic.username");
        if (username == null || username.trim().isEmpty()) {
            username = environment.getProperty("SPRING_DATASOURCE_CLINIC_USERNAME");
        }
        
        String password = environment.getProperty("app.datasource.clinic.password");
        if (password == null || password.trim().isEmpty()) {
            password = environment.getProperty("SPRING_DATASOURCE_CLINIC_PASSWORD");
        }
        
        String driver = environment.getProperty("app.datasource.clinic.driver-class-name");
        if (driver == null || driver.trim().isEmpty()) {
            driver = environment.getProperty("SPRING_DATASOURCE_CLINIC_DRIVER_CLASS_NAME");
        }

        boolean isProduction = java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod") || java.util.Arrays.asList(environment.getActiveProfiles()).contains("production") || java.util.Arrays.asList(environment.getActiveProfiles()).contains("railway") || java.util.Arrays.asList(environment.getActiveProfiles()).contains("render");
        boolean isH2Fallback = url == null || url.trim().isEmpty() || url.contains("jdbc:h2");
        
        if (isProduction) {
            if (isH2Fallback) throw new IllegalStateException("FATAL: SPRING_DATASOURCE_CLINIC_URL is missing in production.");
            if (username == null || username.trim().isEmpty()) throw new IllegalStateException("FATAL: Database username is missing in production.");
        }

        if (isH2Fallback) {
            url = "jdbc:h2:mem:clinicdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;NON_KEYWORDS=VALUE";
            driver = "org.h2.Driver"; // Force driver to match URL
        } else {
            driver = (driver != null && !driver.trim().isEmpty()) ? driver : (url.startsWith("jdbc:postgresql") ? "org.postgresql.Driver" : (url.startsWith("jdbc:tc:postgresql") ? "org.testcontainers.jdbc.ContainerDatabaseDriver" : "org.postgresql.Driver"));
        }

        username = (username != null && !username.trim().isEmpty()) ? username : "sa";
        password = (password != null) ? password : "";

        com.zaxxer.hikari.HikariDataSource dataSource = new com.zaxxer.hikari.HikariDataSource();
        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName(driver);
        dataSource.setKeepaliveTime(environment.getProperty("app.datasource.clinic.keepalive-time", Long.class, 120000L));
        dataSource.setConnectionTestQuery("SELECT 1");
        dataSource.setMaximumPoolSize(environment.getProperty("app.datasource.clinic.maximum-pool-size", Integer.class, 5));
        dataSource.setMinimumIdle(environment.getProperty("app.datasource.clinic.minimum-idle", Integer.class, 1));
        dataSource.setConnectionTimeout(environment.getProperty("app.datasource.clinic.connection-timeout", Long.class, 30000L));
        dataSource.setIdleTimeout(environment.getProperty("app.datasource.clinic.idle-timeout", Long.class, 600000L));
        dataSource.setMaxLifetime(environment.getProperty("app.datasource.clinic.max-lifetime", Long.class, 1800000L));

        try (java.sql.Connection testConn = dataSource.getConnection()) {
            System.out.println("[Clinic DB] Test connection succeeded: "
                + testConn.getMetaData().getURL());
        } catch (java.sql.SQLException e) {
            System.err.println("[Clinic DB] FAILED to establish test connection: "
                + e.getMessage());
            e.printStackTrace();
            throw new IllegalStateException(
                "Clinic datasource is unreachable at startup: " + e.getMessage(), e);
        }

        System.out.println("Configured Clinic DataSource URL: " + url);
        return dataSource;
    }

    @Primary
    @Bean(name = "clinicEntityManagerFactory")
    @DependsOn({"clinicFlyway"})
    public LocalContainerEntityManagerFactoryBean clinicEntityManagerFactory(
            @Qualifier("clinicDataSource") DataSource dataSource,
            org.springframework.core.env.Environment env) {
        
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPersistenceUnitName("clinic");
        em.setPackagesToScan("com.healthcare.clinic");

        em.setJpaVendorAdapter(new org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter());
        
        java.util.HashMap<String, Object> properties = new java.util.HashMap<>();
        String driver = env.getProperty("spring.datasource.clinic.driver-class-name", "org.postgresql.Driver");
        String dialect = "org.hibernate.dialect.PostgreSQLDialect";
        if (driver.contains("mysql")) dialect = "org.hibernate.dialect.MySQLDialect";
        else if (driver.contains("h2")) dialect = "org.hibernate.dialect.H2Dialect";
        
        String ddlAuto = env.getProperty("spring.jpa.hibernate.ddl-auto", "validate");
        properties.put("hibernate.dialect", dialect);
        properties.put("hibernate.hbm2ddl.auto", ddlAuto);
        properties.put("hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy");
        em.setJpaPropertyMap(properties);
        
        return em;
    }

    @Primary
    @Bean(name = "clinicTransactionManager")
    public PlatformTransactionManager clinicTransactionManager(
            @Qualifier("clinicEntityManagerFactory") EntityManagerFactory clinicEntityManagerFactory) {
        return new JpaTransactionManager(clinicEntityManagerFactory);
    }
}
