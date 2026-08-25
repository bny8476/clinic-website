package com.healthcare.clinic.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.HashMap;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.healthcare.clinic.pharmacy.repository",
        entityManagerFactoryRef = "pharmacyEntityManagerFactory",
        transactionManagerRef = "pharmacyTransactionManager",
        nameGenerator =
                org.springframework.context.annotation
                        .FullyQualifiedAnnotationBeanNameGenerator.class
)
public class PharmacyDatabaseConfig {

    @Bean(name = "pharmacyDataSource")
    @ConfigurationProperties(prefix = "app.datasource.pharmacy")
    public DataSource pharmacyDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "pharmacyEntityManagerFactory")
    @DependsOn({"clinicFlyway", "pharmacyFlyway"})
    public LocalContainerEntityManagerFactoryBean pharmacyEntityManagerFactory(
            @Qualifier("pharmacyDataSource") DataSource dataSource,
            org.springframework.core.env.Environment env) {

        LocalContainerEntityManagerFactoryBean em =
                new LocalContainerEntityManagerFactoryBean();

        em.setDataSource(dataSource);

        /*
         * IMPORTANT:
         * PharmacyBill is in pharmacy.model,
         * while other pharmacy entities are in pharmacy.entity.
         */
        em.setPackagesToScan(
                "com.healthcare.clinic.pharmacy.entity",
                "com.healthcare.clinic.pharmacy.model"
        );

        em.setPersistenceUnitName("pharmacy");

        em.setJpaVendorAdapter(new HibernateJpaVendorAdapter());

        HashMap<String, Object> properties = new HashMap<>();

        String driver = env.getProperty(
                "app.datasource.pharmacy.driver-class-name",
                "org.postgresql.Driver"
        );

        String dialect = "org.hibernate.dialect.PostgreSQLDialect";

        if (driver.toLowerCase().contains("mysql")) {
            dialect = "org.hibernate.dialect.MySQLDialect";
        } else if (driver.toLowerCase().contains("h2")) {
            dialect = "org.hibernate.dialect.H2Dialect";
        }

        String ddlAuto = env.getProperty(
                "spring.jpa.hibernate.ddl-auto",
                "validate"
        );

        properties.put("hibernate.dialect", dialect);
        properties.put("hibernate.hbm2ddl.auto", ddlAuto);

        properties.put(
                "hibernate.physical_naming_strategy",
                "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy"
        );

        em.setJpaPropertyMap(properties);

        return em;
    }

    @Bean(name = "pharmacyTransactionManager")
    public PlatformTransactionManager pharmacyTransactionManager(
            @Qualifier("pharmacyEntityManagerFactory")
            EntityManagerFactory pharmacyEntityManagerFactory) {

        return new JpaTransactionManager(pharmacyEntityManagerFactory);
    }
}
