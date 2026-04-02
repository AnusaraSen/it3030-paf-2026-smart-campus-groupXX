package com.smartcampus.server_api.service.ticket;

import com.smartcampus.server_api.dto.ticket.*;
import com.smartcampus.server_api.exception.*;
import com.smartcampus.server_api.model.*;
import com.smartcampus.server_api.repository.ticket.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;
    private final FileStorageService fileStorageService;

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
    public Page<TicketSummaryResponse> getMyTickets(Long userId,
                                                     Pageable pageable) {
        return ticketRepository.findByCreatedBy(userId, pageable)
            .map(this::mapToSummary);
    }

    @Override
    public Page<TicketSummaryResponse> getAllTickets(TicketStatus status,
                                                      TicketPriority priority,
                                                      Long technicianId,
                                                      Pageable pageable) {
        return ticketRepository
            .findAllWithFilters(status, priority, technicianId, pageable)
            .map(this::mapToSummary);
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
        // notificationService.create(ticket.getCreatedBy(),
        //     "Your ticket is now " + request.getStatus(), "TICKET");
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TicketResponse resolveTicket(Long ticketId,
                                         ResolveTicketRequest request) {
        Ticket ticket = findTicketById(ticketId);
        if (ticket.getStatus() != TicketStatus.IN_PROGRESS) {
            throw new InvalidStatusTransitionException(
                "Ticket must be IN_PROGRESS before resolving.");
        }
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolutionNotes(request.getResolutionNotes());
        Ticket saved = ticketRepository.save(ticket);
        // notificationService.create(ticket.getCreatedBy(),
        //     "Your ticket has been RESOLVED", "TICKET");
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
        TicketComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Comment not found with ID: " + commentId));
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
        TicketComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Comment not found with ID: " + commentId));
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
        return ticketRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Ticket not found with ID: " + id));
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse res = new TicketResponse();
        res.setId(ticket.getId());
        res.setResourceId(ticket.getResourceId());
        res.setCreatedBy(ticket.getCreatedBy());
        res.setCategory(ticket.getCategory());
        res.setDescription(ticket.getDescription());
        res.setPriority(ticket.getPriority());
        res.setStatus(ticket.getStatus());
        res.setAssignedTechnicianId(ticket.getAssignedTechnicianId());
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
        res.setCategory(ticket.getCategory());
        res.setPriority(ticket.getPriority());
        res.setStatus(ticket.getStatus());
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
}