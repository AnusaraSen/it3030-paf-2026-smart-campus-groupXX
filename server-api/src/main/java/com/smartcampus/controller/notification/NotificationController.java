package com.smartcampus.controller.notification;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.dto.notification.NotificationResponseDTO;
import com.smartcampus.exception.ForbiddenOperationException;
import com.smartcampus.model.auth_notification.User;
import com.smartcampus.repository.auth_notification.UserRepository;
import com.smartcampus.service.notification.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<List<NotificationResponseDTO>> getMyNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = resolveAuthenticatedUser(userDetails);
        return ResponseEntity.ok(notificationService.getMyNotifications(currentUser.getId()));
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = resolveAuthenticatedUser(userDetails);
        return ResponseEntity.ok(notificationService.getUnreadCount(currentUser.getId()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponseDTO> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = resolveAuthenticatedUser(userDetails);
        return ResponseEntity.ok(notificationService.markAsRead(id, currentUser.getId()));
    }

    @PatchMapping("/me/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = resolveAuthenticatedUser(userDetails);
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    private User resolveAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null || userDetails.getUsername() == null || userDetails.getUsername().isBlank()) {
            throw new ForbiddenOperationException("Authenticated user is required");
        }

        String email = userDetails.getUsername().trim().toLowerCase();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ForbiddenOperationException("Authenticated user could not be resolved"));
    }
}