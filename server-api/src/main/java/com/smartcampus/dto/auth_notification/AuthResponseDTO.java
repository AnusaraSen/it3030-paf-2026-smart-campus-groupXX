package com.smartcampus.dto.auth_notification;

public record AuthResponseDTO(
        String tokenType,
        String accessToken,
        long expiresInSeconds,
        UserResponseDTO user
) {
}
