package com.smartcampus.dto.ticket;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentResponse {
    private Long id;
    private Long userId;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}