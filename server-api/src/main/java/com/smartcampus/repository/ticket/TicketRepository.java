package com.smartcampus.repository.ticket;

import com.smartcampus.model.Ticket;
import com.smartcampus.model.TicketPriority;
import com.smartcampus.model.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Page<Ticket> findByCreatedBy(Long createdBy, Pageable pageable);

    Page<Ticket> findByAssignedTechnicianId(Long technicianId, Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:technicianId IS NULL OR t.assignedTechnicianId = :technicianId)")
    Page<Ticket> findAllWithFilters(
            @Param("status") TicketStatus status,
            @Param("priority") TicketPriority priority,
            @Param("technicianId") Long technicianId,
            Pageable pageable);
}