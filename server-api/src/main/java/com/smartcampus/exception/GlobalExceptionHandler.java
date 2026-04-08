package com.smartcampus.exception;

import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.*;

@RestControllerAdvice(basePackages = "com.smartcampus.controller.ticket")
@Component("ticketGlobalExceptionHandler")
public class GlobalExceptionHandler {

    private Map<String, Object> buildError(int status, String error,
                                            String message, String path) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status);
        body.put("error", error);
        body.put("message", message);
        body.put("path", path);
        return body;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(buildError(404, "Not Found", ex.getMessage(),
                req.getRequestURI()));
    }

    @ExceptionHandler(InvalidStatusTransitionException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidTransition(
            InvalidStatusTransitionException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(buildError(400, "Bad Request", ex.getMessage(),
                req.getRequestURI()));
    }

    @ExceptionHandler(TicketDeletionNotAllowedException.class)
    public ResponseEntity<Map<String, Object>> handleDeletionNotAllowed(
            TicketDeletionNotAllowedException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(buildError(403, "Forbidden", ex.getMessage(),
                req.getRequestURI()));
    }

    @ExceptionHandler(FileUploadException.class)
    public ResponseEntity<Map<String, Object>> handleFileUpload(
            FileUploadException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(buildError(400, "Bad Request", ex.getMessage(),
                req.getRequestURI()));
    }

    @ExceptionHandler(CommentOwnershipException.class)
    public ResponseEntity<Map<String, Object>> handleOwnership(
            CommentOwnershipException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(buildError(403, "Forbidden", ex.getMessage(),
                req.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest req) {
        String firstError = ex.getBindingResult().getFieldErrors()
            .stream()
            .findFirst()
            .map(FieldError::getDefaultMessage)
            .orElse("Validation failed");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(buildError(400, "Bad Request", firstError,
                req.getRequestURI()));
    }

    // Catch-all
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(
            Exception ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(buildError(500, "Internal Server Error",
                "An unexpected error occurred", req.getRequestURI()));
    }

    // ← ADD THE NEW METHOD HERE ↓
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            org.springframework.security.access.AccessDeniedException ex,
            HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(buildError(403, "Forbidden",
                "You do not have permission to access this resource",
                req.getRequestURI()));
    }

} 
