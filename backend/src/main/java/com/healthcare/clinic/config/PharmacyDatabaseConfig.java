package com.healthcare.clinic.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
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
        return DataSourceBuilder.create().type(com.zaxxer.hikari.HikariDataSource.class).build();
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
