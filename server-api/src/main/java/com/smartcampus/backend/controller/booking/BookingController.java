package com.smartcampus.backend.controller.booking;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.backend.dto.BookingRequestDTO;
import com.smartcampus.backend.dto.BookingResponseDTO;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.service.booking.BookingService;

import jakarta.validation.Valid;

// Booking module - Member 2 - REST endpoints implementation

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    // TODO: replace with authenticated user id once auth is integrated
    private static final Long PLACEHOLDER_USER_ID = 1L;

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(@Valid @RequestBody BookingRequestDTO dto) {
        BookingResponseDTO response = bookingService.createBooking(dto, PLACEHOLDER_USER_ID);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<BookingResponseDTO>> getAllBookings(
            @RequestParam(required = false) BookingStatus status,
            @PageableDefault(size = 10, sort = "startDateTime", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(bookingService.getAllBookings(status, pageable));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings() {
        return ResponseEntity.ok(bookingService.getMyBookings(PLACEHOLDER_USER_ID));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<BookingResponseDTO> approveBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<BookingResponseDTO> rejectBooking(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, body.get("reason")));
    }

    // Admin only - hard delete of rejected/cancelled bookings
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String cancelReason = (body != null) ? body.get("cancelReason") : null;
        return ResponseEntity.ok(bookingService.cancelBooking(id, PLACEHOLDER_USER_ID, cancelReason));
    }
}
