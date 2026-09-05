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
        String username = environment.getProperty("app.datasource.clinic.username");
        String password = environment.getProperty("app.datasource.clinic.password");
        String driver = environment.getProperty("app.datasource.clinic.driver-class-name");

        boolean isProduction = isProductionEnvironment();

        // Helper check for Railway / Render / standard DB environment variables
        if (url == null || url.trim().isEmpty() || (url.contains("localhost:5432") && isProduction)) {
            String envUrl = getFirstNonEmptyProperty("DATABASE_URL", "SPRING_DATASOURCE_URL", "SPRING_DATASOURCE_CLINIC_URL", "POSTGRES_URL", "MYSQL_URL", "DB_URL");
            if (envUrl != null && !envUrl.trim().isEmpty()) {
                url = envUrl;
            }
        }

        // Standardize Railway/Render postgres:// or postgresql:// format into JDBC format
        if (url != null && (url.startsWith("postgres://") || url.startsWith("postgresql://") || url.startsWith("jdbc:postgres://"))) {
            try {
                String cleanUrl = url.replace("jdbc:", "");
                if (cleanUrl.startsWith("postgres://")) {
                    cleanUrl = "postgresql://" + cleanUrl.substring("postgres://".length());
                }
                java.net.URI uri = new java.net.URI(cleanUrl);
                if (uri.getUserInfo() != null && uri.getUserInfo().contains(":")) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    if (username == null || username.trim().isEmpty() || username.equals("postgres")) {
                        username = userInfo[0];
                    }
                    if (password == null || password.trim().isEmpty() || password.equals("postgres")) {
                        password = userInfo[1];
                    }
                }
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                url = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();
            } catch (Exception e) {
                System.err.println("[Clinic DB] Warning parsing DATABASE_URL: " + e.getMessage());
            }
        }

        if (username == null || username.trim().isEmpty()) {
            username = getFirstNonEmptyProperty("DB_USER", "DATABASE_USER", "PGUSER", "POSTGRES_USER", "SPRING_DATASOURCE_CLINIC_USERNAME");
        }
        if (password == null || password.trim().isEmpty()) {
            password = getFirstNonEmptyProperty("DB_PASSWORD", "DATABASE_PASSWORD", "PGPASSWORD", "POSTGRES_PASSWORD", "SPRING_DATASOURCE_CLINIC_PASSWORD");
        }

        boolean isH2Fallback = url == null || url.trim().isEmpty();

        if (isH2Fallback) {
            System.out.println("[Clinic DB] No external DB configured, using H2 in-memory DB.");
            return createH2FallbackDataSource();
        }

        driver = (driver != null && !driver.trim().isEmpty()) ? driver : (url.contains("h2") ? "org.h2.Driver" : "org.postgresql.Driver");
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
            System.out.println("[Clinic DB] Test connection succeeded: " + testConn.getMetaData().getURL());
        } catch (java.sql.SQLException e) {
            System.err.println("[Clinic DB] FAILED to establish test connection to " + url + ": " + e.getMessage());
            System.out.println("[Clinic DB] Falling back to H2 in-memory DB to ensure web application remains operational.");
            return createH2FallbackDataSource();
        }

        System.out.println("Configured Clinic DataSource URL: " + url);
        return dataSource;
    }

    private boolean isProductionEnvironment() {
        return java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod") ||
               java.util.Arrays.asList(environment.getActiveProfiles()).contains("production") ||
               java.util.Arrays.asList(environment.getActiveProfiles()).contains("railway") ||
               java.util.Arrays.asList(environment.getActiveProfiles()).contains("render");
    }

    private String getFirstNonEmptyProperty(String... keys) {
        for (String key : keys) {
            String val = environment.getProperty(key);
            if (val != null && !val.trim().isEmpty()) {
                return val.trim();
            }
        }
        return null;
    }

    private DataSource createH2FallbackDataSource() {
        com.zaxxer.hikari.HikariDataSource fallback = new com.zaxxer.hikari.HikariDataSource();
        fallback.setJdbcUrl("jdbc:h2:mem:clinicdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;NON_KEYWORDS=VALUE;MODE=PostgreSQL");
        fallback.setUsername("sa");
        fallback.setPassword("");
        fallback.setDriverClassName("org.h2.Driver");
        fallback.setMaximumPoolSize(5);
        return fallback;
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
        String url = env.getProperty("app.datasource.clinic.url", "");
        String driver = env.getProperty("app.datasource.clinic.driver-class-name", "");
        boolean isH2 = url.contains("jdbc:h2") || url.isEmpty();
        String dialect = (isH2 || driver.contains("h2")) ? "org.hibernate.dialect.H2Dialect" : (driver.contains("mysql") ? "org.hibernate.dialect.MySQLDialect" : "org.hibernate.dialect.PostgreSQLDialect");

        
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
