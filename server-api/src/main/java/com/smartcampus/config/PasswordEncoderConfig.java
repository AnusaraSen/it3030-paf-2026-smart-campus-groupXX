package com.smartcampus.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordEncoderConfig {

    /**
     * Password encoder required by services (and optionally security).
     * Uses BCrypt for compatibility with the JWT security implementation.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        // Demo only: Basic auth uses plain text passwords.
        // This keeps `user/password` working for the frontend quickly.
        return NoOpPasswordEncoder.getInstance();
    }
}

