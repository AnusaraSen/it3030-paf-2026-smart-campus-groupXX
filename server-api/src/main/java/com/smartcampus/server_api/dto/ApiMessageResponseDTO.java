package com.smartcampus.server_api.dto;

import java.time.OffsetDateTime;

public record ApiMessageResponseDTO(
        String message,
        OffsetDateTime timestamp
) {
    public static ApiMessageResponseDTO of(String message) {
        return new ApiMessageResponseDTO(message, OffsetDateTime.now());
    }
}
