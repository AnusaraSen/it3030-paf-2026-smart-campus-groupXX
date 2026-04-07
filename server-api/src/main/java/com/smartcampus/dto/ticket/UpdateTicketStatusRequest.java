package com.smartcampus.dto.ticket;

import com.smartcampus.model.TicketStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateTicketStatusRequest {

    @NotNull(message = "Status is required")
    private TicketStatus status;

    @Size(max = 500, message = "Rejection reason must not exceed 500 characters")
    private String rejectionReason;
}