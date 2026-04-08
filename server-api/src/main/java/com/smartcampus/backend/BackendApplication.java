package com.smartcampus.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.smartcampus.server_api.security.SecurityConfig;

@SpringBootApplication
@ComponentScan(
	basePackages = {"com.smartcampus.backend", "com.smartcampus.server_api"},
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class)
)
@EntityScan(basePackages = {"com.smartcampus.backend.model", "com.smartcampus.server_api.model"})
@EnableJpaRepositories(basePackages = {"com.smartcampus.backend.repository", "com.smartcampus.server_api.repository"})
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
