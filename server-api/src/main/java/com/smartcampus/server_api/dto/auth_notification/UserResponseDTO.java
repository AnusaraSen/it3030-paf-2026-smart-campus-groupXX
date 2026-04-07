package com.smartcampus.server_api.dto.auth_notification;

import java.time.LocalDateTime;

import com.smartcampus.server_api.model.auth_notification.Role;

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
