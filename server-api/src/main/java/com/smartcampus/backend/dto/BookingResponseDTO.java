package com.smartcampus.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingResponseDTO {

    private Long id;
    private Long resourceId;
    private Long userId;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private String purpose;
    private Integer expectedAttendees;
    private String status;
    private String rejectionReason;
    private String cancelReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
