package com.smartcampus.backend.service.booking;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartcampus.backend.dto.BookingRequestDTO;
import com.smartcampus.backend.dto.BookingResponseDTO;
import com.smartcampus.backend.exception.ResourceConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.server_api.model.facilities.Resource;
import com.smartcampus.server_api.model.facilities.ResourceAvailabilityWindow;
import com.smartcampus.server_api.model.facilities.ResourceStatus;
import com.smartcampus.server_api.repository.facilities.ResourceRepository;

// Business logic

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    public BookingServiceImpl(BookingRepository bookingRepository, ResourceRepository resourceRepository) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
    }

    @Override
    @Transactional
    @SuppressWarnings("null")
    public BookingResponseDTO createBooking(BookingRequestDTO dto, Long userId) {
        Long resourceId = Objects.requireNonNull(dto.getResourceId(), "Resource ID is required");

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + resourceId));

        if (!dto.getEndDateTime().isAfter(dto.getStartDateTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        if (Duration.between(dto.getStartDateTime(), dto.getEndDateTime()).toMinutes() < 30) {
            throw new IllegalArgumentException("Minimum booking duration is 30 minutes");
        }

        ensureResourceIsBookable(resource, dto.getStartDateTime(), dto.getEndDateTime());

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            resourceId,
                dto.getStartDateTime(),
                dto.getEndDateTime()
        );

        if (!conflicts.isEmpty()) {
            throw new ResourceConflictException(
                "Resource " + resourceId + " is already booked during the requested time slot"
            );
        }

        Booking booking = Booking.builder()
            .resourceId(resourceId)
                .userId(userId)
                .startDateTime(dto.getStartDateTime())
                .endDateTime(dto.getEndDateTime())
                .purpose(dto.getPurpose())
                .expectedAttendees(dto.getExpectedAttendees())
                .status(BookingStatus.PENDING)
                .cancelReason(null)
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        return toResponse(savedBooking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getMyBookings(Long userId) {
        return bookingRepository.findByUserIdOrderByStartDateTimeDesc(Objects.requireNonNull(userId, "User ID is required")).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponseDTO> getAllBookings(BookingStatus status, Pageable pageable) {
        Pageable pageRequest = Objects.requireNonNull(pageable, "Pageable is required");

        if (status != null) {
            return bookingRepository.findByStatus(status, pageRequest).map(this::toResponse);
        }

        return bookingRepository.findAll(pageRequest).map(this::toResponse);
    }

    @Override
    @Transactional
    public BookingResponseDTO approveBooking(Long bookingId) {
        Booking booking = findById(Objects.requireNonNull(bookingId, "Booking ID is required"));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResourceConflictException("Only PENDING bookings can be approved");
        }
        booking.setStatus(BookingStatus.APPROVED);
        return toResponse(Objects.requireNonNull(bookingRepository.save(booking)));
    }

    @Override
    @Transactional
    public BookingResponseDTO rejectBooking(Long bookingId, String reason) {
        Booking booking = findById(Objects.requireNonNull(bookingId, "Booking ID is required"));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResourceConflictException("Only PENDING bookings can be rejected");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        return toResponse(Objects.requireNonNull(bookingRepository.save(booking)));
    }

    @Override
    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId, Long userId, String cancelReason) {
        Booking booking = findById(Objects.requireNonNull(bookingId, "Booking ID is required"));
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new ResourceConflictException("Only APPROVED bookings can be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(cancelReason);
        return toResponse(Objects.requireNonNull(bookingRepository.save(booking)));
    }

    @Override
    @Transactional
    public void deleteBooking(Long id) {
        Long bookingId = Objects.requireNonNull(id, "Booking ID is required");
        Booking booking = findById(bookingId);
        if (booking.getStatus() != BookingStatus.REJECTED && booking.getStatus() != BookingStatus.CANCELLED) {
            throw new ResourceConflictException("Only REJECTED or CANCELLED bookings can be deleted");
        }
        bookingRepository.deleteById(bookingId);
    }

    private Booking findById(Long bookingId) {
        return bookingRepository.findById(Objects.requireNonNull(bookingId, "Booking ID is required"))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + bookingId
                ));
    }

    private void ensureResourceIsBookable(Resource resource, LocalDateTime startDateTime, LocalDateTime endDateTime) {
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new ResourceConflictException("Resource is not available for booking");
        }

        List<ResourceAvailabilityWindow> availabilityWindows = resource.getAvailabilityWindows();
        if (availabilityWindows == null || availabilityWindows.isEmpty()) {
            throw new ResourceConflictException("Resource has no availability windows configured");
        }

        if (!startDateTime.toLocalDate().equals(endDateTime.toLocalDate())) {
            throw new ResourceConflictException("Booking must be within a single availability day");
        }

        DayOfWeek bookingDay = startDateTime.getDayOfWeek();
        LocalTime bookingStart = startDateTime.toLocalTime();
        LocalTime bookingEnd = endDateTime.toLocalTime();

        boolean withinWindow = availabilityWindows.stream().anyMatch(window ->
                window.getDayOfWeek() == bookingDay
                        && !bookingStart.isBefore(window.getStartTime())
                        && !bookingEnd.isAfter(window.getEndTime()));

        if (!withinWindow) {
            throw new ResourceConflictException("Requested time is outside the resource availability windows");
        }
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
