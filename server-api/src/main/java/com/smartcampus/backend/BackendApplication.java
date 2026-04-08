package com.smartcampus.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {
		"com.smartcampus.backend",
		"com.smartcampus.server_api"
})
@EnableJpaRepositories(basePackages = {
        "com.smartcampus.backend.repository",
        "com.smartcampus.server_api.repository"
})
@EntityScan(basePackages = {
        "com.smartcampus.backend.model",
        "com.smartcampus.server_api.model"
})
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
