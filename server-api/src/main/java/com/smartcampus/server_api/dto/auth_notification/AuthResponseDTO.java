package com.smartcampus.server_api.dto.auth_notification;

public record AuthResponseDTO(
        String tokenType,
        String accessToken,
        long expiresInSeconds,
        UserResponseDTO user
) {
}
