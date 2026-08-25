package com.healthcare.clinic.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.context.annotation.DependsOn;
import javax.sql.DataSource;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.healthcare.clinic.pharmacy.repository",
        entityManagerFactoryRef = "pharmacyEntityManagerFactory",
        transactionManagerRef = "pharmacyTransactionManager",
        nameGenerator = org.springframework.context.annotation.FullyQualifiedAnnotationBeanNameGenerator.class
)
public class PharmacyDatabaseConfig {

    @Bean(name = "pharmacyEntityManagerFactory")
    @DependsOn({"clinicFlyway", "pharmacyFlyway"})
    public LocalContainerEntityManagerFactoryBean pharmacyEntityManagerFactory(
            @Qualifier("clinicDataSource") DataSource dataSource,
            org.springframework.core.env.Environment env) {
        
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.healthcare.clinic.pharmacy.entity");
        em.setPersistenceUnitName("pharmacy");

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

    @Bean(name = "pharmacyTransactionManager")
    public PlatformTransactionManager pharmacyTransactionManager(
            @Qualifier("pharmacyEntityManagerFactory") EntityManagerFactory pharmacyEntityManagerFactory) {
        return new JpaTransactionManager(pharmacyEntityManagerFactory);
    }
}
