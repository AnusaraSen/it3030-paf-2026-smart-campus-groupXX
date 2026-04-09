package com.smartcampus.server_api.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.smartcampus.server_api.model.auth_notification.User;
import com.smartcampus.server_api.repository.auth_notification.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String authorityRole = user.getRole() == null ? "USER" : normalizeRole(user.getRole().name());

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_" + authorityRole)
                .build();
    }

    private static String normalizeRole(String role) {
        if ("USERS".equalsIgnoreCase(role)) {
            return "USER";
        }

        return role == null || role.isBlank() ? "USER" : role.toUpperCase();
    }
}
