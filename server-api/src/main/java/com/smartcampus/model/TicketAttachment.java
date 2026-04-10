package com.smartcampus.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_attachments")
@Data
public class TicketAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();
}