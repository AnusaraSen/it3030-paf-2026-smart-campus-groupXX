package com.smartcampus.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

// DTO

@Data
public class BookingRequestDTO {

    @NotNull
    private Long resourceId;

    @NotNull
    @Future
    private LocalDateTime startDateTime;

    @NotNull
    private LocalDateTime endDateTime;

    @NotBlank
    @Size(max = 255)
    private String purpose;

    @Min(1)
    private Integer expectedAttendees;

    @Size(max = 500)
    private String cancelReason;
}
