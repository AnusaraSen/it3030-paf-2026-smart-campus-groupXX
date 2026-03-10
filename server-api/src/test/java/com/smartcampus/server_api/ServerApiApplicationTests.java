package com.smartcampus.server_api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ServerApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
