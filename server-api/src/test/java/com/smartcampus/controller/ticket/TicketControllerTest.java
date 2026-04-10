package com.smartcampus.controller.ticket;

import java.util.List;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mockito;
import org.mockito.ArgumentCaptor;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.dto.ticket.CreateTicketRequest;
import com.smartcampus.dto.ticket.TicketResponse;
import com.smartcampus.dto.ticket.TicketSummaryResponse;
import com.smartcampus.model.auth_notification.User;
import com.smartcampus.repository.auth_notification.UserRepository;
import com.smartcampus.service.ticket.TicketService;

class TicketControllerTest {

    private final TicketService ticketService = Mockito.mock(TicketService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserRepository userRepository = Mockito.mock(UserRepository.class);
    private final TicketController controller = new TicketController(ticketService, objectMapper, userRepository);

    @Test
    void getAllTickets_resolvesTechnicianIdWithoutCastingPrincipal() {
        TicketSummaryResponse summary = new TicketSummaryResponse();
        summary.setId(11L);
        List<TicketSummaryResponse> content = new ArrayList<>();
        content.add(summary);
        Page<TicketSummaryResponse> expectedPage = new PageImpl<>(content);

        User technician = new User();
        technician.setId(42L);
        technician.setEmail("tech@smartcampus.edu");
        when(userRepository.findByEmail("tech@smartcampus.edu")).thenReturn(java.util.Optional.of(technician));
        when(ticketService.getAllTickets(any(), any(), eq(42L), any(Pageable.class))).thenReturn(expectedPage);

        Authentication authentication = new UsernamePasswordAuthenticationToken(
            "tech@smartcampus.edu",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_TECHNICIAN")));

        Page<TicketSummaryResponse> response = controller.getAllTickets(
                null,
                null,
                null,
                0,
                10,
                authentication)
            .getBody();

        assertThat(response).isEqualTo(expectedPage);
        verify(ticketService).getAllTickets(eq(null), eq(null), eq(42L), any(Pageable.class));
    }

    @Test
    void getAllTickets_ignoresInvalidFiltersInsteadOfFailing() {
        Page<TicketSummaryResponse> expectedPage = new PageImpl<>(new ArrayList<>());
        when(ticketService.getAllTickets(eq(null), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(expectedPage);

        Page<TicketSummaryResponse> response = controller.getAllTickets(
                "ALL",
                "unexpected-value",
                null,
                0,
                10,
                null)
                .getBody();

        assertThat(response).isEqualTo(expectedPage);
        verify(ticketService).getAllTickets(eq(null), eq(null), eq(null), any(Pageable.class));
    }

    @Test
    void createTicket_usesAuthenticatedUserIdAndEmailForContactFallback() throws Exception {
        User currentUser = new User();
        currentUser.setId(42L);
        currentUser.setEmail("student@campus.com");
        when(userRepository.findByEmail("student@campus.com")).thenReturn(java.util.Optional.of(currentUser));

        TicketResponse ticketResponse = new TicketResponse();
        ticketResponse.setId(99L);
        when(ticketService.createTicket(any(CreateTicketRequest.class), eq(null), eq(42L))).thenReturn(ticketResponse);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                "student@campus.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_USERS")));

        String payload = """
                {
                  "resourceId": 7,
                  "category": "NETWORK",
                  "description": "Projector is offline",
                  "priority": "HIGH",
                  "preferredContact": ""
                }
                """;

        TicketResponse response = controller.createTicket(payload, null, userDetails).getBody();

        assertThat(response).isEqualTo(ticketResponse);

        ArgumentCaptor<CreateTicketRequest> requestCaptor = ArgumentCaptor.forClass(CreateTicketRequest.class);
        verify(ticketService).createTicket(requestCaptor.capture(), eq(null), eq(42L));
        assertThat(requestCaptor.getValue().getPreferredContact()).isEqualTo("student@campus.com");
    }

    @Test
    void updateTicket_usesAuthenticatedUserIdAndEmailForContactFallback() throws Exception {
        User currentUser = new User();
        currentUser.setId(42L);
        currentUser.setEmail("student@campus.com");
        when(userRepository.findByEmail("student@campus.com")).thenReturn(java.util.Optional.of(currentUser));

        TicketResponse ticketResponse = new TicketResponse();
        ticketResponse.setId(99L);
        when(ticketService.updateTicket(eq(99L), any(CreateTicketRequest.class), eq(42L))).thenReturn(ticketResponse);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                "student@campus.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_USERS")));

        String payload = """
                {
                  "resourceId": 7,
                  "category": "NETWORK",
                  "description": "Projector is offline",
                  "priority": "HIGH",
                  "preferredContact": ""
                }
                """;

        TicketResponse response = controller.updateTicket(99L, objectMapper.readValue(payload, CreateTicketRequest.class), userDetails).getBody();

        assertThat(response).isEqualTo(ticketResponse);

        ArgumentCaptor<CreateTicketRequest> requestCaptor = ArgumentCaptor.forClass(CreateTicketRequest.class);
        verify(ticketService).updateTicket(eq(99L), requestCaptor.capture(), eq(42L));
        assertThat(requestCaptor.getValue().getPreferredContact()).isEqualTo("student@campus.com");
    }
}
