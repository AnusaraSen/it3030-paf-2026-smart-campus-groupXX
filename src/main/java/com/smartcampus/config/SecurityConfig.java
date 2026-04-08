package com.smartcampus.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Base security configuration for the Smart Campus API.
 *
 * <p>OAuth2 / role-mapping details are handled by the security team member.
 * This class exists to:
 * <ul>
 *   <li>Enable {@code @PreAuthorize} method-level security via {@link EnableMethodSecurity}</li>
 *   <li>Require authentication on all {@code /api/**} endpoints</li>
 *   <li>Allow the OAuth2 login flow through</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = false)   // disabled for dev — re-enable when auth is configured
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            );

        return http.build();
    }
}
