package com.smartcampus.exception;

public class TicketDeletionNotAllowedException extends RuntimeException {
    public TicketDeletionNotAllowedException(String message) {
        super(message);
    }
}