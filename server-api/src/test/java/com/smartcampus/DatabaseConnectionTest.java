package com.smartcampus;

import java.sql.Connection;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = BackendApplication.class)
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
