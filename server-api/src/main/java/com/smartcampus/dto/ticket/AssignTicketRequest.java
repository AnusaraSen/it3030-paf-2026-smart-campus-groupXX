package com.smartcampus.dto.ticket;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignTicketRequest {

    @NotNull(message = "Technician ID is required")
    private Long technicianId;
}
