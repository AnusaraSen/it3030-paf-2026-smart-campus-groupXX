package com.smartcampus.dto.auth_notification;

import java.time.LocalDateTime;

import com.smartcampus.model.auth_notification.Role;

public record UserResponseDTO(
        Long id,
        String firstName,
        String lastName,
        String email,
        Role role,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
