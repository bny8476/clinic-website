package com.healthcare.clinic.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.context.annotation.DependsOn;
import javax.sql.DataSource;
import java.util.HashMap;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.healthcare.clinic.pharmacy",
        entityManagerFactoryRef = "pharmacyEntityManagerFactory",
        transactionManagerRef = "pharmacyTransactionManager",
        nameGenerator = org.springframework.context.annotation.FullyQualifiedAnnotationBeanNameGenerator.class
)
public class PharmacyDatabaseConfig {

    @Autowired
    private Environment env;

    @Bean(name = "pharmacyDataSource")
    @ConfigurationProperties(prefix = "app.datasource.pharmacy")
    public DataSource pharmacyDataSource() {
        String url = env.getProperty("SPRING_DATASOURCE_PHARMACY_URL");
        String username = env.getProperty("SPRING_DATASOURCE_PHARMACY_USERNAME");
        String password = env.getProperty("SPRING_DATASOURCE_PHARMACY_PASSWORD");
        String driver = env.getProperty("SPRING_DATASOURCE_PHARMACY_DRIVER_CLASS_NAME");

        boolean isRender = java.util.Arrays.asList(env.getActiveProfiles()).contains("render");
        if (isRender) {
            if (url == null || url.trim().isEmpty()) throw new IllegalStateException("FATAL: SPRING_DATASOURCE_PHARMACY_URL is missing in production.");
            if (username == null || username.trim().isEmpty()) throw new IllegalStateException("FATAL: SPRING_DATASOURCE_PHARMACY_USERNAME is missing in production.");
        }

        url = (url != null && !url.trim().isEmpty()) ? url : "jdbc:h2:mem:pharmacydb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;NON_KEYWORDS=VALUE";
        username = (username != null && !username.trim().isEmpty()) ? username : "sa";
        password = (password != null) ? password : "";
        driver = (driver != null && !driver.trim().isEmpty()) ? driver : "org.h2.Driver";

        com.zaxxer.hikari.HikariDataSource dataSource = new com.zaxxer.hikari.HikariDataSource();
        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName(driver);
        System.out.println("Configured Pharmacy DataSource URL: " + url);
        return dataSource;
    }

    @Bean(name = "pharmacyEntityManagerFactory")
    @DependsOn("pharmacyFlyway")
    public LocalContainerEntityManagerFactoryBean pharmacyEntityManagerFactory(
            @Qualifier("pharmacyDataSource") DataSource dataSource,
            org.springframework.core.env.Environment env) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPersistenceUnitName("pharmacy");
        em.setPackagesToScan(
                "com.healthcare.clinic.pharmacy"
        );

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);
        HashMap<String, Object> properties = new HashMap<>();
        String driver = env.getProperty("spring.datasource.pharmacy.driver-class-name", "org.h2.Driver");
        String dialect = "org.hibernate.dialect.H2Dialect";
        if (driver.contains("mysql")) dialect = "org.hibernate.dialect.MySQLDialect";
        else if (driver.contains("postgresql")) dialect = "org.hibernate.dialect.PostgreSQLDialect";
        
        String ddlAuto = env.getProperty("spring.jpa.hibernate.ddl-auto", "validate");
        properties.put("hibernate.dialect", dialect);
        properties.put("hibernate.hbm2ddl.auto", ddlAuto);
        properties.put("hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy");
        em.setJpaPropertyMap(properties);

        return em;
    }

    @Bean(name = "pharmacyTransactionManager")
    public PlatformTransactionManager pharmacyTransactionManager(
            @Qualifier("pharmacyEntityManagerFactory") LocalContainerEntityManagerFactoryBean pharmacyEntityManagerFactory) {
        return new JpaTransactionManager(pharmacyEntityManagerFactory.getObject());
    }
}
