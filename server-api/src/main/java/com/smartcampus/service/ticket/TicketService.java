package com.smartcampus.server_api.service.ticket;
import com.smartcampus.server_api.dto.ticket.*;
import com.smartcampus.server_api.model.TicketPriority;
import com.smartcampus.server_api.model.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface TicketService {
    TicketResponse createTicket(CreateTicketRequest request,
                                List<MultipartFile> files, Long userId);
    Page<TicketSummaryResponse> getMyTickets(Long userId, Pageable pageable);
    Page<TicketSummaryResponse> getAllTickets(TicketStatus status,
                                              TicketPriority priority,
                                              Long technicianId,
                                              Pageable pageable);
    TicketResponse assignTechnician(Long ticketId,
                                    AssignTicketRequest request);
    TicketResponse updateStatus(Long ticketId,
                                UpdateTicketStatusRequest request,
                                Long userId, String userRole);
    TicketResponse resolveTicket(Long ticketId,
                                 ResolveTicketRequest request);
    void deleteTicket(Long ticketId, Long userId);
    CommentResponse addComment(Long ticketId,
                               AddCommentRequest request, Long userId);
    CommentResponse editComment(Long commentId,
                                AddCommentRequest request, Long userId);
    void deleteComment(Long commentId, Long userId, String userRole);
}
