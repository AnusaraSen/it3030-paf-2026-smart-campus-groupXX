package com.smartcampus.dto.ticket;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AttachmentResponse {
    private Long id;
    private String originalName;
    private String fileUrl;
    private LocalDateTime uploadedAt;
}