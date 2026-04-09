package com.smartcampus.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResolveTicketRequest {

    @NotBlank(message = "Resolution notes are required")
    private String resolutionNotes;
}