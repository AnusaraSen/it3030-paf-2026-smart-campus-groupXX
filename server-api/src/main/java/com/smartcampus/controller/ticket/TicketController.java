package com.smartcampus.controller.ticket;

import java.util.List;

import com.fasterxml.jackson.core.JsonProcessingException;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.dto.ticket.AddCommentRequest;
import com.smartcampus.dto.ticket.AssignTicketRequest;
import com.smartcampus.dto.ticket.CommentResponse;
import com.smartcampus.dto.ticket.CreateTicketRequest;
import com.smartcampus.dto.ticket.ResolveTicketRequest;
import com.smartcampus.dto.ticket.TicketResponse;
import com.smartcampus.dto.ticket.TicketSummaryResponse;
import com.smartcampus.dto.ticket.UpdateTicketStatusRequest;
import com.smartcampus.exception.FileUploadException;
import com.smartcampus.exception.ForbiddenOperationException;
import com.smartcampus.model.TicketPriority;
import com.smartcampus.model.TicketStatus;
import com.smartcampus.model.auth_notification.User;
import com.smartcampus.repository.auth_notification.UserRepository;
import com.smartcampus.service.ticket.TicketService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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
            if (request.getResourceId() == null) {
                throw new IllegalArgumentException("Resource ID is required");
            }
            if (request.getCategory() == null) {
                throw new IllegalArgumentException("Category is required");
            }
            if (request.getPriority() == null) {
                throw new IllegalArgumentException("Priority is required");
            }

            User currentUser = resolveAuthenticatedUser(userDetails);
            request.setPreferredContact(resolvePreferredContact(request.getPreferredContact(), currentUser.getEmail()));

            Long userId = currentUser.getId();
            TicketResponse response = ticketService.createTicket(request, files, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException | JsonProcessingException e) {
            throw new FileUploadException(e.getMessage());
        } catch (FileUploadException e) {
            throw e;
        }
    }

    @GetMapping("/my")
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
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long technicianId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Long effectiveTechnicianId = technicianId;
        TicketStatus parsedStatus = parseTicketStatus(status);
        TicketPriority parsedPriority = parseTicketPriority(priority);
        if (authentication != null && hasRole(authentication, "ROLE_TECHNICIAN")
                && !hasRole(authentication, "ROLE_ADMIN")) {
            effectiveTechnicianId = resolveUserId(authentication);
        }
        return ResponseEntity.ok(
                ticketService.getAllTickets(parsedStatus, parsedPriority, effectiveTechnicianId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketResponse> updateTicket(
            @PathVariable Long id,
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = resolveAuthenticatedUser(userDetails);
        request.setPreferredContact(resolvePreferredContact(request.getPreferredContact(), currentUser.getEmail()));
        return ResponseEntity.ok(ticketService.updateTicket(id, request, currentUser.getId()));
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
    public ResponseEntity<Void> deleteTicket(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        ticketService.deleteTicket(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/comments")
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
        if (userDetails == null || userDetails.getUsername() == null) {
            return 1L;
        }

        return userRepository.findByEmail(userDetails.getUsername().toLowerCase())
                .map(User::getId)
                .orElse(1L);
    }

    private Long resolveUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return 1L;
        }

        return userRepository.findByEmail(authentication.getName().toLowerCase())
                .map(User::getId)
                .orElse(1L);
    }

    private User resolveAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null || userDetails.getUsername() == null || userDetails.getUsername().isBlank()) {
            throw new ForbiddenOperationException("Authenticated user is required");
        }

        String email = userDetails.getUsername().trim().toLowerCase();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ForbiddenOperationException("Authenticated user could not be resolved"));
    }

    private static String resolvePreferredContact(String preferredContact, String authenticatedEmail) {
        if (preferredContact != null && !preferredContact.isBlank()) {
            return preferredContact.trim();
        }

        if (authenticatedEmail != null && !authenticatedEmail.isBlank()) {
            return authenticatedEmail.trim().toLowerCase();
        }

        throw new ForbiddenOperationException("Preferred contact could not be resolved from the authenticated user");
    }

    private static TicketStatus parseTicketStatus(String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {
            return null;
        }

        try {
            return TicketStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static TicketPriority parseTicketPriority(String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {
            return null;
        }

        try {
            return TicketPriority.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}

