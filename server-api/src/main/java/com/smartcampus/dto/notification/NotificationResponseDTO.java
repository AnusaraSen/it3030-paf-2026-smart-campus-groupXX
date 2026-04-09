package com.smartcampus.dto.notification;

import java.time.LocalDateTime;

public record NotificationResponseDTO(
        Long id,
        Long userId,
        String title,
        String message,
        String type,
        boolean isRead,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}