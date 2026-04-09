package com.smartcampus.repository.booking;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.smartcampus.model.booking.Booking;
import com.smartcampus.model.booking.BookingStatus;

// JPA repository

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByStartDateTimeDesc(Long userId);

    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);

    @Query("SELECT b FROM Booking b WHERE b.resourceId = :resourceId " +
           "AND b.status IN :activeStatuses " +
           "AND b.startDateTime < :endDateTime " +
           "AND b.endDateTime > :startDateTime")
    List<Booking> findConflictingBookings(@Param("resourceId") Long resourceId,
                                          @Param("startDateTime") LocalDateTime startDateTime,
                                          @Param("endDateTime") LocalDateTime endDateTime,
                                          @Param("activeStatuses") Set<BookingStatus> activeStatuses);
}

