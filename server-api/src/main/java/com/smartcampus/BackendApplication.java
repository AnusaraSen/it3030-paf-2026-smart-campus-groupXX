package com.smartcampus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {
		"com.smartcampus"
})
@ComponentScan(excludeFilters = {
		@ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.smartcampus\\.config\\.SecurityConfig")
})
@EnableJpaRepositories(basePackages = {
		"com.smartcampus"
})
@EntityScan(basePackages = {
		"com.smartcampus"
})
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
