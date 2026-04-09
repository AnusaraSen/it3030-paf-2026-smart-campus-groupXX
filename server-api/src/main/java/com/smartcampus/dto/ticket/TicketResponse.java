package com.smartcampus.dto.ticket;

import com.smartcampus.model.TicketCategory;
import com.smartcampus.model.TicketPriority;
import com.smartcampus.model.TicketStatus;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TicketResponse {
    private Long id;
    private Long resourceId;
    private String resourceName;
    private Long createdBy;
    private String createdByName;
    private TicketCategory category;
    private String description;
    private TicketPriority priority;
    private TicketStatus status;
    private Long assignedTechnicianId;
    private String assignedTechnicianName;
    private String resolutionNotes;
    private String preferredContact;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private List<AttachmentResponse> attachments;
    private List<CommentResponse> comments;
}