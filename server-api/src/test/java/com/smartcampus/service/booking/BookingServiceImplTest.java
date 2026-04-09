package com.smartcampus.service.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.RETURNS_DEFAULTS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.smartcampus.dto.booking.BookingRequestDTO;
import com.smartcampus.dto.booking.BookingResponseDTO;
import com.smartcampus.model.booking.Booking;
import com.smartcampus.model.facilities.Resource;
import com.smartcampus.model.facilities.ResourceAvailabilityWindow;
import com.smartcampus.model.facilities.ResourceStatus;
import com.smartcampus.model.facilities.ResourceType;
import com.smartcampus.repository.booking.BookingRepository;
import com.smartcampus.repository.facilities.ResourceRepository;
import com.smartcampus.service.notification.NotificationService;

class BookingServiceImplTest {

    @Test
    void createBooking_notifiesAdminsWhenBookingIsCreated() {
        BookingRepository bookingRepository = mock(BookingRepository.class, invocation -> {
            String methodName = invocation.getMethod().getName();

            if ("save".equals(methodName)) {
                Booking booking = invocation.getArgument(0);
                booking.setId(99L);
                return booking;
            }

            if ("findConflictingBookings".equals(methodName)) {
                return List.of();
            }

            return RETURNS_DEFAULTS.answer(invocation);
        });
        ResourceRepository resourceRepository = mock(ResourceRepository.class);
        NotificationService notificationService = mock(NotificationService.class);
        BookingServiceImpl bookingService = new BookingServiceImpl(bookingRepository, resourceRepository, notificationService);

        LocalDate date = LocalDate.of(2026, 4, 13);
        DayOfWeek dayOfWeek = date.getDayOfWeek();

        Resource resource = new Resource();
        resource.setName("Lecture Hall A");
        resource.setType(ResourceType.LECTURE_HALL);
        resource.setCapacity(40);
        resource.setLocation("Building A");
        resource.setStatus(ResourceStatus.ACTIVE);

        ResourceAvailabilityWindow window = new ResourceAvailabilityWindow();
        window.setResource(resource);
        window.setDayOfWeek(dayOfWeek);
        window.setStartTime(LocalTime.of(8, 0));
        window.setEndTime(LocalTime.of(18, 0));
        List<ResourceAvailabilityWindow> windows = new ArrayList<>();
        windows.add(window);
        resource.setAvailabilityWindows(windows);

        when(resourceRepository.findById(1L)).thenReturn(java.util.Optional.of(resource));

        BookingRequestDTO request = new BookingRequestDTO();
        request.setResourceId(1L);
        request.setStartDateTime(LocalDateTime.of(2026, 4, 13, 10, 0));
        request.setEndDateTime(LocalDateTime.of(2026, 4, 13, 11, 0));
        request.setPurpose("Team meeting");
        request.setExpectedAttendees(12);

        BookingResponseDTO response = bookingService.createBooking(request, 7L);

        assertThat(response.getId()).isEqualTo(99L);
        verify(notificationService).notifyAdmins(
                "Booking Created",
                "A new booking was created for Lecture Hall A from 2026-04-13T10:00 to 2026-04-13T11:00",
                "BOOKING_CREATED");
    }
}
