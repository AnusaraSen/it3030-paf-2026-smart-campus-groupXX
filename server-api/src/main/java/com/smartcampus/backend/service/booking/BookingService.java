package com.smartcampus.backend.service.booking;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.smartcampus.backend.dto.BookingRequestDTO;
import com.smartcampus.backend.dto.BookingResponseDTO;
import com.smartcampus.backend.model.BookingStatus;

public interface BookingService {

    BookingResponseDTO createBooking(BookingRequestDTO dto, Long userId);

    List<BookingResponseDTO> getMyBookings(Long userId);

    Page<BookingResponseDTO> getAllBookings(BookingStatus status, Pageable pageable);

    BookingResponseDTO approveBooking(Long bookingId);

    BookingResponseDTO rejectBooking(Long bookingId, String reason);

    BookingResponseDTO cancelBooking(Long bookingId, Long userId, String cancelReason);

    void deleteBooking(Long id);
}
