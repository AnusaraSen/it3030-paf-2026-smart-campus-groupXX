package com.smartcampus.dto.ticket;

import com.smartcampus.model.TicketCategory;
import com.smartcampus.model.TicketPriority;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateTicketRequest {

    @NotNull(message = "Resource ID is required")
    private Long resourceId;

    @NotNull(message = "Category is required")
    private TicketCategory category;

    @NotBlank(message = "Description is required")
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    @NotBlank(message = "Preferred contact is required")
    @Size(max = 255, message = "Preferred contact must not exceed 255 characters")
    private String preferredContact;
}