package com.smartcampus.backend.service.booking;

import com.smartcampus.backend.dto.BookingRequestDTO;
import com.smartcampus.backend.dto.BookingResponseDTO;
import com.smartcampus.backend.exception.ResourceConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;

    @Override
    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO dto, Long userId) {
        if (!dto.getEndDateTime().isAfter(dto.getStartDateTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        if (Duration.between(dto.getStartDateTime(), dto.getEndDateTime()).toMinutes() < 30) {
            throw new IllegalArgumentException("Minimum booking duration is 30 minutes");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                dto.getResourceId(),
                dto.getStartDateTime(),
                dto.getEndDateTime()
        );
        if (!conflicts.isEmpty()) {
            throw new ResourceConflictException(
                    "Resource " + dto.getResourceId() + " is already booked during the requested time slot"
            );
        }

        Booking booking = Booking.builder()
                .resourceId(dto.getResourceId())
                .userId(userId)
                .startDateTime(dto.getStartDateTime())
                .endDateTime(dto.getEndDateTime())
                .purpose(dto.getPurpose())
                .expectedAttendees(dto.getExpectedAttendees())
                .status(BookingStatus.PENDING)
                .cancelReason(null)
                .build();

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getMyBookings(Long userId) {
        return bookingRepository.findByUserIdOrderByStartDateTimeDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponseDTO> getAllBookings(BookingStatus status, Pageable pageable) {
        if (status != null) {
            return bookingRepository.findByStatus(status, pageable).map(this::toResponse);
        }
        return bookingRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public BookingResponseDTO approveBooking(Long bookingId) {
        Booking booking = findById(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResourceConflictException("Only PENDING bookings can be approved");
        }
        booking.setStatus(BookingStatus.APPROVED);
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional
    public BookingResponseDTO rejectBooking(Long bookingId, String reason) {
        Booking booking = findById(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResourceConflictException("Only PENDING bookings can be rejected");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId, Long userId, String cancelReason) {
        Booking booking = findById(bookingId);
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new ResourceConflictException("Only APPROVED bookings can be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(cancelReason);
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = findById(id);
        if (booking.getStatus() != BookingStatus.REJECTED && booking.getStatus() != BookingStatus.CANCELLED) {
            throw new ResourceConflictException("Only REJECTED or CANCELLED bookings can be deleted");
        }
        bookingRepository.deleteById(id);
    }

    private Booking findById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + bookingId
                ));
    }

    private BookingResponseDTO toResponse(Booking booking) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId(booking.getId());
        dto.setResourceId(booking.getResourceId());
        dto.setUserId(booking.getUserId());
        dto.setStartDateTime(booking.getStartDateTime());
        dto.setEndDateTime(booking.getEndDateTime());
        dto.setPurpose(booking.getPurpose());
        dto.setExpectedAttendees(booking.getExpectedAttendees());
        dto.setStatus(booking.getStatus().name());
        dto.setRejectionReason(booking.getRejectionReason());
        dto.setCancelReason(booking.getCancelReason());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setUpdatedAt(booking.getUpdatedAt());
        return dto;
    }
}
