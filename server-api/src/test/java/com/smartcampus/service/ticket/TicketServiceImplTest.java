package com.smartcampus.service.ticket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.RETURNS_DEFAULTS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import java.lang.reflect.Constructor;

import org.junit.jupiter.api.Test;

import com.smartcampus.dto.ticket.CreateTicketRequest;
import com.smartcampus.dto.ticket.ResolveTicketRequest;
import com.smartcampus.dto.ticket.TicketResponse;
import com.smartcampus.dto.ticket.UpdateTicketStatusRequest;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.TicketCategory;
import com.smartcampus.model.TicketPriority;
import com.smartcampus.model.TicketStatus;
import com.smartcampus.model.auth_notification.Role;
import com.smartcampus.model.auth_notification.User;
import com.smartcampus.model.facilities.Resource;
import com.smartcampus.repository.auth_notification.UserRepository;
import com.smartcampus.repository.facilities.ResourceRepository;
import com.smartcampus.repository.ticket.TicketAttachmentRepository;
import com.smartcampus.repository.ticket.TicketCommentRepository;
import com.smartcampus.repository.ticket.TicketRepository;
import com.smartcampus.service.notification.NotificationService;

class TicketServiceImplTest {

    @Test
    void createTicket_notifiesAdminsWhenTicketIsCreated() {
        Ticket ticket = buildTicket(TicketStatus.OPEN);
        ticket.setId(99L);

        TicketRepository ticketRepository = mock(TicketRepository.class, invocation -> {
            if ("save".equals(invocation.getMethod().getName())) {
                return ticket;
            }
            return invocation.callRealMethod();
        });
        TicketAttachmentRepository attachmentRepository = mock(TicketAttachmentRepository.class);
        TicketCommentRepository commentRepository = mock(TicketCommentRepository.class);
        FileStorageService fileStorageService = mock(FileStorageService.class);
        ResourceRepository resourceRepository = mock(ResourceRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        NotificationService notificationService = mock(NotificationService.class);

        when(attachmentRepository.findByTicketId(99L)).thenReturn(List.of());
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc(99L)).thenReturn(List.of());
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(buildResource("Lecture Hall A")));
        when(userRepository.findById(7L)).thenReturn(Optional.of(buildUser(7L, "Pimashi", "Wickramarachchi", "pimashi.w@campus.com", Role.USERS)));
        when(userRepository.findAllByRole(Role.ADMIN)).thenReturn(List.of(buildUser(11L, "Admin", "One", "admin1@campus.com", Role.ADMIN)));

        TicketServiceImpl service = createService(
            ticketRepository,
            attachmentRepository,
            commentRepository,
            fileStorageService,
            resourceRepository,
            userRepository,
            notificationService);

        CreateTicketRequest request = new CreateTicketRequest();
        request.setResourceId(1L);
        request.setCategory(TicketCategory.ELECTRICAL);
        request.setDescription("Projector is not working");
        request.setPriority(TicketPriority.HIGH);
        request.setPreferredContact("student@campus.com");

        TicketResponse response = service.createTicket(request, List.of(), 7L);

        assertThat(response.getId()).isEqualTo(99L);
        verify(notificationService).notifyAdmins(
            "New Ticket Created",
            "Ticket #99 was created for Lecture Hall A by Pimashi Wickramarachchi (Category: ELECTRICAL) (Priority: HIGH).",
            "TICKET_CREATED");
    }

    @Test
    void updateStatus_persistsStatusAndNotifiesRecipients() {
        Ticket ticket = buildTicket(TicketStatus.OPEN);

        TicketRepository ticketRepository = mock(TicketRepository.class, invocation -> {
            if ("findById".equals(invocation.getMethod().getName())) {
                return Optional.of(ticket);
            }
            if ("save".equals(invocation.getMethod().getName())) {
                return invocation.getArgument(0);
            }
            return RETURNS_DEFAULTS.answer(invocation);
        });
        ResourceRepository resourceRepository = mock(ResourceRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        NotificationService notificationService = mock(NotificationService.class);

        when(resourceRepository.findById(1L)).thenReturn(Optional.of(buildResource("Room 101")));
        when(userRepository.findById(7L)).thenReturn(Optional.of(buildUser(7L, "Pimashi", "Wickramarachchi", "pimashi.w@campus.com", Role.USERS)));
        when(userRepository.findById(3L)).thenReturn(Optional.of(buildUser(3L, "Copilot", "Tech", "tech@campus.com", Role.TECHNICIAN)));
        when(userRepository.findAllByRole(Role.ADMIN)).thenReturn(List.of(buildUser(11L, "Admin", "One", "admin1@campus.com", Role.ADMIN)));

        TicketServiceImpl service = createService(
            ticketRepository,
            mock(TicketAttachmentRepository.class),
            mock(TicketCommentRepository.class),
            mock(FileStorageService.class),
            resourceRepository,
            userRepository,
            notificationService);

        UpdateTicketStatusRequest request = new UpdateTicketStatusRequest();
        request.setStatus(TicketStatus.IN_PROGRESS);

        TicketResponse response = service.updateStatus(1L, request, 3L, "ROLE_TECHNICIAN");

        assertThat(response.getStatus()).isEqualTo(TicketStatus.IN_PROGRESS);
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.IN_PROGRESS);
        verify(notificationService).notifyUsers(any(), eq("Ticket status updated"), eq("Ticket #1 for Room 101 changed from OPEN to IN_PROGRESS. Updated by Copilot Tech."), eq("TICKET_STATUS"));
    }

    @Test
    void resolveTicket_persistsStatusAndNotifiesRecipients() {
        Ticket ticket = buildTicket(TicketStatus.IN_PROGRESS);

        TicketRepository ticketRepository = mock(TicketRepository.class, invocation -> {
            if ("findById".equals(invocation.getMethod().getName())) {
                return Optional.of(ticket);
            }
            if ("save".equals(invocation.getMethod().getName())) {
                return invocation.getArgument(0);
            }
            return RETURNS_DEFAULTS.answer(invocation);
        });
        ResourceRepository resourceRepository = mock(ResourceRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        NotificationService notificationService = mock(NotificationService.class);

        when(resourceRepository.findById(1L)).thenReturn(Optional.of(buildResource("Room 101")));
        when(userRepository.findById(7L)).thenReturn(Optional.of(buildUser(7L, "Pimashi", "Wickramarachchi", "pimashi.w@campus.com", Role.USERS)));
        when(userRepository.findAllByRole(Role.ADMIN)).thenReturn(List.of(buildUser(11L, "Admin", "One", "admin1@campus.com", Role.ADMIN)));

        TicketServiceImpl service = createService(
            ticketRepository,
            mock(TicketAttachmentRepository.class),
            mock(TicketCommentRepository.class),
            mock(FileStorageService.class),
            resourceRepository,
            userRepository,
            notificationService);

        ResolveTicketRequest request = new ResolveTicketRequest();
        request.setResolutionNotes("Fixed the projector.");

        TicketResponse response = service.resolveTicket(1L, request);

        assertThat(response.getStatus()).isEqualTo(TicketStatus.RESOLVED);
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.RESOLVED);
        verify(notificationService).notifyUsers(any(), eq("Ticket status updated"), eq("Ticket #1 for Room 101 changed from IN_PROGRESS to RESOLVED."), eq("TICKET_STATUS"));
    }

    private static Ticket buildTicket(TicketStatus status) {
        Ticket ticket = new Ticket();
        ticket.setId(1L);
        ticket.setResourceId(1L);
        ticket.setCreatedBy(7L);
        ticket.setCategory(TicketCategory.ELECTRICAL);
        ticket.setDescription("Need fixing immediately");
        ticket.setPriority(TicketPriority.HIGH);
        ticket.setStatus(status);
        ticket.setPreferredContact("pimashi.w@campus.com");
        return ticket;
    }

    private static Resource buildResource(String name) {
        Resource resource = new Resource();
        resource.setName(name);
        return resource;
    }

    private static TicketServiceImpl createService(
            TicketRepository ticketRepository,
            TicketAttachmentRepository attachmentRepository,
            TicketCommentRepository commentRepository,
            FileStorageService fileStorageService,
            ResourceRepository resourceRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        try {
            Constructor<TicketServiceImpl> constructor = TicketServiceImpl.class.getDeclaredConstructor(
                    TicketRepository.class,
                    TicketAttachmentRepository.class,
                    TicketCommentRepository.class,
                    FileStorageService.class,
                    ResourceRepository.class,
                    UserRepository.class,
                    NotificationService.class);
            constructor.setAccessible(true);
            return constructor.newInstance(
                    ticketRepository,
                    attachmentRepository,
                    commentRepository,
                    fileStorageService,
                    resourceRepository,
                    userRepository,
                    notificationService);
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError("Unable to construct TicketServiceImpl for test", exception);
        }
    }

    private static User buildUser(Long id,
                                  String firstName,
                                  String lastName,
                                  String email,
                                  Role role) {
        User user = new User();
        user.setId(id);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setRole(role);
        return user;
    }
}