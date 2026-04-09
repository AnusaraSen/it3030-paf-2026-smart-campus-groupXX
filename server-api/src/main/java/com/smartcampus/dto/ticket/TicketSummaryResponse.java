package com.smartcampus.dto.ticket;

import com.smartcampus.model.TicketCategory;
import com.smartcampus.model.TicketPriority;
import com.smartcampus.model.TicketStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TicketSummaryResponse {
    private Long id;
    private String resourceName;
    private TicketCategory category;
    private TicketPriority priority;
    private TicketStatus status;
    private LocalDateTime createdAt;
}