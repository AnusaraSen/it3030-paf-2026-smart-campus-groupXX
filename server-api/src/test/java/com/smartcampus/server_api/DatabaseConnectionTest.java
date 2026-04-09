package com.smartcampus.server_api;

import java.sql.Connection;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.smartcampus.backend.BackendApplication;

@SpringBootTest(classes = BackendApplication.class)
@ActiveProfiles("h2")
public class DatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void testConnection() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            System.out.println("Database connected: " + connection.isValid(2));
        }
    }
}