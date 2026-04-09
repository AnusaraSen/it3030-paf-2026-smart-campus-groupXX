package com.smartcampus.service.ticket;

import com.smartcampus.dto.ticket.*;
import com.smartcampus.exception.*;
import com.smartcampus.model.*;
import com.smartcampus.model.auth_notification.User;
import com.smartcampus.model.auth_notification.Role;
import com.smartcampus.model.facilities.Resource;
import com.smartcampus.repository.auth_notification.UserRepository;
import com.smartcampus.repository.facilities.ResourceRepository;
import com.smartcampus.repository.ticket.*;
import com.smartcampus.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketServiceImpl.class);

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;
    private final FileStorageService fileStorageService;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request,
                                       List<MultipartFile> files,
                                       Long userId) {
        if (files != null && files.size() > 3) {
            throw new FileUploadException(
                "Maximum 3 attachments allowed per ticket.");
        }
        Ticket ticket = new Ticket();
        ticket.setResourceId(request.getResourceId());
        ticket.setCreatedBy(userId);
        ticket.setCategory(request.getCategory());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(request.getPriority());
        ticket.setPreferredContact(request.getPreferredContact());
        ticket.setStatus(TicketStatus.OPEN);
        Ticket saved = ticketRepository.save(ticket);

        if (files != null) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String storedName = fileStorageService.storeFile(file);
                    TicketAttachment attachment = new TicketAttachment();
                    attachment.setTicket(saved);
                    attachment.setFilePath(storedName);
                    attachment.setOriginalName(file.getOriginalFilename());
                    attachmentRepository.save(attachment);
                }
            }
        }
        return mapToResponse(saved);
    }

    @Override
    public TicketResponse getTicketById(Long id) {
        return mapToResponse(findTicketById(id));
    }

    @Override
    @Transactional
    public TicketResponse updateTicket(Long ticketId, CreateTicketRequest request, Long userId) {
        Ticket ticket = findTicketById(ticketId);
        if (!Objects.equals(ticket.getCreatedBy(), userId)) {
            throw new ForbiddenOperationException("You can only edit your own tickets.");
        }

        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new ForbiddenOperationException("Only OPEN tickets can be edited.");
        }

        ticket.setResourceId(request.getResourceId());
        ticket.setCategory(request.getCategory());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(request.getPriority());
        ticket.setPreferredContact(request.getPreferredContact());

        return mapToResponse(ticketRepository.save(ticket));
    }

    @Override
    public Page<TicketSummaryResponse> getMyTickets(Long userId,
                                                     Pageable pageable) {
        try {
            return ticketRepository.findByCreatedBy(userId, pageable)
                .map(this::mapToSummary);
        } catch (Exception ex) {
            log.error("Failed to load my tickets for userId={}", userId, ex);
            throw ex;
        }
    }

    @Override
    public Page<TicketSummaryResponse> getAllTickets(TicketStatus status,
                                                      TicketPriority priority,
                                                      Long technicianId,
                                                      Pageable pageable) {
        try {
            return ticketRepository
                .findAllWithFilters(status, priority, technicianId, pageable)
                .map(this::mapToSummary);
        } catch (Exception ex) {
            log.error("Failed to load staff tickets status={}, priority={}, technicianId={}",
                status, priority, technicianId, ex);
            throw ex;
        }
    }

    @Override
    @Transactional
    public TicketResponse assignTechnician(Long ticketId,
                                            AssignTicketRequest request) {
        Ticket ticket = findTicketById(ticketId);
        ticket.setAssignedTechnicianId(request.getTechnicianId());
        return mapToResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    public TicketResponse updateStatus(Long ticketId,
                                        UpdateTicketStatusRequest request,
                                        Long userId, String userRole) {
        Ticket ticket = findTicketById(ticketId);
        TicketStatus previousStatus = ticket.getStatus();
        validateStatusTransition(ticket.getStatus(),
            request.getStatus(), userRole);
        if (request.getStatus() == TicketStatus.REJECTED) {
            if (request.getRejectionReason() == null ||
                request.getRejectionReason().isBlank()) {
                throw new InvalidStatusTransitionException(
                    "Rejection reason is required.");
            }
            ticket.setRejectionReason(request.getRejectionReason());
        }
        ticket.setStatus(request.getStatus());
        Ticket saved = ticketRepository.save(ticket);
        notifyTicketStatusChange(saved, previousStatus, request.getStatus(), userId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TicketResponse resolveTicket(Long ticketId,
                                         ResolveTicketRequest request) {
        Ticket ticket = findTicketById(ticketId);
        TicketStatus previousStatus = ticket.getStatus();
        if (ticket.getStatus() != TicketStatus.IN_PROGRESS) {
            throw new InvalidStatusTransitionException(
                "Ticket must be IN_PROGRESS before resolving.");
        }
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolutionNotes(request.getResolutionNotes());
        Ticket saved = ticketRepository.save(ticket);
        notifyTicketStatusChange(saved, previousStatus, TicketStatus.RESOLVED, null);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteTicket(Long ticketId, Long userId) {
        Ticket ticket = findTicketById(ticketId);
        if (!ticket.getCreatedBy().equals(userId)) {
            throw new TicketDeletionNotAllowedException(
                "You can only delete your own tickets.");
        }
        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new TicketDeletionNotAllowedException(
                "Only OPEN tickets can be deleted.");
        }
        attachmentRepository.findByTicketId(ticketId)
            .forEach(a -> fileStorageService.deleteFile(a.getFilePath()));
        ticketRepository.delete(ticket);
    }

    @Override
    @Transactional
    public CommentResponse addComment(Long ticketId,
                                       AddCommentRequest request,
                                       Long userId) {
        Ticket ticket = findTicketById(ticketId);
        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setUserId(userId);
        comment.setMessage(request.getMessage());
        TicketComment saved = commentRepository.save(comment);
        // notificationService.create(ticket.getCreatedBy(),
        //     "New comment on your ticket", "COMMENT");
        return mapToCommentResponse(saved);
    }

    @Override
    @Transactional
    public CommentResponse editComment(Long commentId,
                                        AddCommentRequest request,
                                        Long userId) {
        Long resolvedCommentId = Objects.requireNonNull(commentId, "Comment ID is required");
        TicketComment comment = commentRepository.findById(resolvedCommentId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Comment not found with ID: " + resolvedCommentId));
        if (!comment.getUserId().equals(userId)) {
            throw new CommentOwnershipException(
                "You can only edit your own comments.");
        }
        comment.setMessage(request.getMessage());
        return mapToCommentResponse(commentRepository.save(comment));
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, Long userId, String userRole) {
        Long resolvedCommentId = Objects.requireNonNull(commentId, "Comment ID is required");
        TicketComment comment = commentRepository.findById(resolvedCommentId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Comment not found with ID: " + resolvedCommentId));
        boolean isOwner = comment.getUserId().equals(userId);
        boolean isAdmin = "ROLE_ADMIN".equals(userRole);
        if (!isOwner && !isAdmin) {
            throw new CommentOwnershipException(
                "You are not allowed to delete this comment.");
        }
        commentRepository.delete(comment);
    }

    private void validateStatusTransition(TicketStatus current,
                                           TicketStatus next,
                                           String userRole) {
        boolean isAdmin = "ROLE_ADMIN".equals(userRole);
        switch (current) {
            case OPEN -> {
                if (next != TicketStatus.IN_PROGRESS &&
                    next != TicketStatus.REJECTED)
                    throw new InvalidStatusTransitionException(
                        "OPEN tickets can only move to IN_PROGRESS or REJECTED.");
                if (next == TicketStatus.REJECTED && !isAdmin)
                    throw new InvalidStatusTransitionException(
                        "Only ADMIN can reject tickets.");
            }
            case IN_PROGRESS -> {
                if (next != TicketStatus.RESOLVED &&
                    next != TicketStatus.REJECTED)
                    throw new InvalidStatusTransitionException(
                        "IN_PROGRESS tickets can only move to RESOLVED or REJECTED.");
            }
            case RESOLVED -> {
                if (next != TicketStatus.CLOSED)
                    throw new InvalidStatusTransitionException(
                        "RESOLVED tickets can only move to CLOSED.");
                if (!isAdmin)
                    throw new InvalidStatusTransitionException(
                        "Only ADMIN can close tickets.");
            }
            case CLOSED, REJECTED -> throw new InvalidStatusTransitionException(
                "Terminal status — no further changes allowed.");
        }
    }

    private Ticket findTicketById(Long id) {
        Long resolvedTicketId = Objects.requireNonNull(id, "Ticket ID is required");
        return ticketRepository.findById(resolvedTicketId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Ticket not found with ID: " + resolvedTicketId));
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse res = new TicketResponse();
        res.setId(ticket.getId());
        res.setResourceId(ticket.getResourceId());
        res.setResourceName(resolveResourceName(ticket.getResourceId()));
        res.setCreatedBy(ticket.getCreatedBy());
        res.setCreatedByName(resolveUserDisplayName(ticket.getCreatedBy()));
        res.setCategory(ticket.getCategory());
        res.setDescription(ticket.getDescription());
        res.setPriority(ticket.getPriority());
        res.setStatus(ticket.getStatus());
        res.setAssignedTechnicianId(ticket.getAssignedTechnicianId());
        res.setAssignedTechnicianName(resolveUserDisplayName(ticket.getAssignedTechnicianId()));
        res.setResolutionNotes(ticket.getResolutionNotes());
        res.setPreferredContact(ticket.getPreferredContact());
        res.setRejectionReason(ticket.getRejectionReason());
        res.setCreatedAt(ticket.getCreatedAt());
        List<AttachmentResponse> attachments = attachmentRepository
            .findByTicketId(ticket.getId())
            .stream().map(a -> {
                AttachmentResponse ar = new AttachmentResponse();
                ar.setId(a.getId());
                ar.setOriginalName(a.getOriginalName());
                ar.setFileUrl("/uploads/" + a.getFilePath());
                ar.setUploadedAt(a.getUploadedAt());
                return ar;
            }).collect(Collectors.toList());
        res.setAttachments(attachments);
        List<CommentResponse> comments = commentRepository
            .findByTicketIdOrderByCreatedAtAsc(ticket.getId())
            .stream().map(this::mapToCommentResponse)
            .collect(Collectors.toList());
        res.setComments(comments);
        return res;
    }

    private TicketSummaryResponse mapToSummary(Ticket ticket) {
        TicketSummaryResponse res = new TicketSummaryResponse();
        res.setId(ticket.getId());
        res.setResourceId(ticket.getResourceId());
        res.setResourceName(resolveResourceName(ticket.getResourceId()));
        res.setCreatedBy(ticket.getCreatedBy());
        res.setCreatedByName(resolveUserDisplayName(ticket.getCreatedBy()));
        res.setCategory(ticket.getCategory());
        res.setPriority(ticket.getPriority());
        res.setStatus(ticket.getStatus());
        res.setAssignedTechnicianId(ticket.getAssignedTechnicianId());
        res.setAssignedTechnicianName(resolveUserDisplayName(ticket.getAssignedTechnicianId()));
        res.setCreatedAt(ticket.getCreatedAt());
        return res;
    }

    private CommentResponse mapToCommentResponse(TicketComment comment) {
        CommentResponse res = new CommentResponse();
        res.setId(comment.getId());
        res.setUserId(comment.getUserId());
        res.setMessage(comment.getMessage());
        res.setCreatedAt(comment.getCreatedAt());
        res.setUpdatedAt(comment.getUpdatedAt());
        return res;
    }

    private String resolveResourceName(Long resourceId) {
        if (resourceId == null) {
            return null;
        }

        return resourceRepository.findById(resourceId)
            .map(Resource::getName)
            .orElse(null);
    }

    private String resolveUserDisplayName(Long userId) {
        if (userId == null) {
            return null;
        }

        return userRepository.findById(userId)
            .map(TicketServiceImpl::formatUserDisplayName)
            .orElse(null);
    }

    private static String formatUserDisplayName(User user) {
        if (user == null) {
            return null;
        }

        String explicitName = user.getName();
        if (explicitName != null && !explicitName.isBlank()) {
            return explicitName.trim();
        }

        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();
        String fullName = (firstName + " " + lastName).trim().replaceAll("\\s+", " ");

        if (!fullName.isBlank()) {
            return fullName;
        }

        return user.getEmail();
    }

    private void notifyTicketStatusChange(Ticket ticket,
                                          TicketStatus previousStatus,
                                          TicketStatus nextStatus,
                                          Long changedByUserId) {
        if (ticket == null || nextStatus == null) {
            return;
        }

        List<Long> recipientIds = new java.util.ArrayList<>();
        recipientIds.add(ticket.getCreatedBy());
        recipientIds.addAll(userRepository.findAllByRole(Role.ADMIN).stream()
            .map(User::getId)
            .toList());

        String resourceName = resolveResourceName(ticket.getResourceId());
        String changedByName = resolveUserDisplayName(changedByUserId);
        String title = "Ticket status updated";
        String message = buildTicketStatusMessage(
            ticket.getId(), resourceName, previousStatus, nextStatus, changedByName);

        notificationService.notifyUsers(recipientIds, title, message, "TICKET_STATUS");
    }

    private static String buildTicketStatusMessage(Long ticketId,
                                                   String resourceName,
                                                   TicketStatus previousStatus,
                                                   TicketStatus nextStatus,
                                                   String changedByName) {
        StringBuilder message = new StringBuilder();
        message.append("Ticket #").append(ticketId);

        if (resourceName != null && !resourceName.isBlank()) {
            message.append(" for ").append(resourceName);
        }

        if (previousStatus != null) {
            message.append(" changed from ").append(previousStatus);
        } else {
            message.append(" changed");
        }

        message.append(" to ").append(nextStatus).append('.');

        if (changedByName != null && !changedByName.isBlank()) {
            message.append(" Updated by ").append(changedByName).append('.');
        }

        return message.toString();
    }
}