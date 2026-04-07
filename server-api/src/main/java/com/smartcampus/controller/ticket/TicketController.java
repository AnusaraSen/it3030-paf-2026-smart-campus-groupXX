package com.smartcampus.server_api.controller.ticket;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.server_api.dto.ticket.*;
import com.smartcampus.server_api.model.TicketPriority;
import com.smartcampus.server_api.model.TicketStatus;
import com.smartcampus.server_api.service.ticket.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@PreAuthorize("hasRole('USER')")
public ResponseEntity<TicketResponse> createTicket(
        @RequestPart("data") String dataJson,
        @RequestPart(value = "files", required = false)
            List<MultipartFile> files,
        @AuthenticationPrincipal UserDetails userDetails) {

    try {
        ObjectMapper mapper = new ObjectMapper();
        CreateTicketRequest request = mapper.readValue(
            dataJson, CreateTicketRequest.class);

        // Manual validation
        if (request.getDescription() == null || 
            request.getDescription().isBlank()) {
            throw new IllegalArgumentException(
                "Description is required");
        }
        if (request.getDescription().length() > 1000) {
            throw new IllegalArgumentException(
                "Description must not exceed 1000 characters");
        }
        if (request.getPreferredContact() == null || 
            request.getPreferredContact().isBlank()) {
            throw new IllegalArgumentException(
                "Preferred contact is required");
        }
        if (request.getResourceId() == null) {
            throw new IllegalArgumentException(
                "Resource ID is required");
        }
        if (request.getCategory() == null) {
            throw new IllegalArgumentException(
                "Category is required");
        }
        if (request.getPriority() == null) {
            throw new IllegalArgumentException(
                "Priority is required");
        }

        Long userId = extractUserId(userDetails);
        TicketResponse response = ticketService.createTicket(
            request, files, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);

    }  (IllegalArgumentException e) {
            throw new com.smartcampus.server_api.exception.FileUploadException(e.getMessage());

    } catch (Exception e) {
        throw new RuntimeException(
            "Invalid request data: " + e.getMessage());
    }
}
    

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<TicketSummaryResponse>> getMyTickets(
            @RequestParam(defaultValue = "0") int pacatchge,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        Pageable pageable = PageRequest.of(page, size,
            Sort.by("createdAt").descending());
        return ResponseEntity.ok(
            ticketService.getMyTickets(userId, pageable));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<TicketSummaryResponse>> getAllTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) Long technicianId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size,
            Sort.by("createdAt").descending());
        return ResponseEntity.ok(
            ticketService.getAllTickets(status, priority,
                technicianId, pageable));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable Long id,
            @Valid @RequestBody AssignTicketRequest request) {
        return ResponseEntity.ok(
            ticketService.assignTechnician(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        String role = userDetails.getAuthorities()
            .iterator().next().getAuthority();
        return ResponseEntity.ok(
            ticketService.updateStatus(id, request, userId, role));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<TicketResponse> resolveTicket(
            @PathVariable Long id,
            @Valid @RequestBody ResolveTicketRequest request) {
        return ResponseEntity.ok(
            ticketService.resolveTicket(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        ticketService.deleteTicket(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody AddCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ticketService.addComment(id, request, userId));
    }

    private Long extractUserId(UserDetails userDetails) {
        // Replace with actual implementation after Member 4 sets up OAuth
        return 1L;
    }
}