package com.smartcampus.controller.ticket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.dto.ticket.*;
import com.smartcampus.exception.FileUploadException;
import com.smartcampus.model.TicketPriority;
import com.smartcampus.model.TicketStatus;
import com.smartcampus.service.ticket.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TicketResponse> createTicket(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            CreateTicketRequest request =
                    objectMapper.readValue(dataJson, CreateTicketRequest.class);

            if (request.getDescription() == null || request.getDescription().isBlank()) {
                throw new IllegalArgumentException("Description is required");
            }
            if (request.getDescription().length() > 1000) {
                throw new IllegalArgumentException("Description must not exceed 1000 characters");
            }
            if (request.getPreferredContact() == null || request.getPreferredContact().isBlank()) {
                throw new IllegalArgumentException("Preferred contact is required");
            }
            if (request.getResourceId() == null) {
                throw new IllegalArgumentException("Resource ID is required");
            }
            if (request.getCategory() == null) {
                throw new IllegalArgumentException("Category is required");
            }
            if (request.getPriority() == null) {
                throw new IllegalArgumentException("Priority is required");
            }

            Long userId = extractUserId(userDetails);
            TicketResponse response = ticketService.createTicket(request, files, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            throw new FileUploadException(e.getMessage());
        } catch (FileUploadException e) {
            throw e;
        } catch (Exception e) {
            throw new FileUploadException("Invalid request data: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<TicketSummaryResponse>> getMyTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ticketService.getMyTickets(userId, pageable));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<Page<TicketSummaryResponse>> getAllTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) Long technicianId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Long effectiveTechnicianId = technicianId;
        if (authentication != null && hasRole(authentication, "ROLE_TECHNICIAN")
                && !hasRole(authentication, "ROLE_ADMIN")) {
            effectiveTechnicianId = extractUserId(
                    (UserDetails) authentication.getPrincipal());
        }
        return ResponseEntity.ok(
                ticketService.getAllTickets(status, priority, effectiveTechnicianId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable Long id, @Valid @RequestBody AssignTicketRequest request) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        String role = userDetails.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(ticketService.updateStatus(id, request, userId, role));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<TicketResponse> resolveTicket(
            @PathVariable Long id, @Valid @RequestBody ResolveTicketRequest request) {
        return ResponseEntity.ok(ticketService.resolveTicket(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
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

    private static boolean hasRole(Authentication auth, String role) {
        for (GrantedAuthority a : auth.getAuthorities()) {
            if (role.equals(a.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    private Long extractUserId(UserDetails userDetails) {
        // Replace with JWT / user repository lookup when auth is wired
        return 1L;
    }
}
