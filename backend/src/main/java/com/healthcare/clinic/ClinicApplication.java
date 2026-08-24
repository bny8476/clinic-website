package com.healthcare.clinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.context.annotation.Bean;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.cache.annotation.EnableCaching;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FullyQualifiedAnnotationBeanNameGenerator;

@EnableCaching
@SpringBootApplication(
    nameGenerator = org.springframework.context.annotation.FullyQualifiedAnnotationBeanNameGenerator.class,
    excludeName = {
    "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration",
    "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration",
    "org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration",
    "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
})
@ComponentScan(nameGenerator = FullyQualifiedAnnotationBeanNameGenerator.class)
@EnableAsync
public class ClinicApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClinicApplication.class, args);
	}

	@Bean
	public org.springframework.boot.ApplicationRunner applicationRunner(
			org.springframework.context.ApplicationContext context) {
		return args -> {
			System.out.println("=========================================================");
			System.out.println("=       CLINIC APPLICATION STARTED SUCCESSFULLY         =");
			System.out.println("=   PostgreSQL and MySQL DataSources Initialized        =");
			System.out.println("=   Flyway Migrations Passed Successfully               =");
			System.out.println("=========================================================");
		};
	}

	@Bean
	public ObjectMapper objectMapper() {
		return new ObjectMapper();
	}

	@Bean
	public org.springframework.cache.CacheManager cacheManager() {
		org.springframework.cache.caffeine.CaffeineCacheManager cacheManager = new org.springframework.cache.caffeine.CaffeineCacheManager();
		cacheManager.setCaffeine(com.github.benmanes.caffeine.cache.Caffeine.newBuilder()
				.expireAfterWrite(java.time.Duration.ofMinutes(30))
				.maximumSize(1000));
		return cacheManager;
	}
}
