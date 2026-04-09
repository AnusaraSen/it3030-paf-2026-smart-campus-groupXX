package com.smartcampus.server_api;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.smartcampus.backend.BackendApplication;
import com.smartcampus.server_api.dto.auth_notification.UserRequestDTO;
import com.smartcampus.server_api.repository.auth_notification.UserRepository;
import com.smartcampus.server_api.service.auth_notification.UserService;

@SpringBootTest(classes = BackendApplication.class)
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never"
})
class UserRegistrationPersistenceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void registerUser_persistsToDatabase() {
        var request = new UserRequestDTO(
                "Akila",
                "Doe",
                "akila@campus.com",
                "Test@1234",
                null);

        var created = userService.register(request);

        assertNotNull(created.id());
        assertTrue(userRepository.existsByEmail("akila@campus.com"));
    }
}
