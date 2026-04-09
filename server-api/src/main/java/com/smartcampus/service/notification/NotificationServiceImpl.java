package com.smartcampus.service.notification;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartcampus.dto.notification.NotificationResponseDTO;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.notification.Notification;
import com.smartcampus.model.auth_notification.Role;
import com.smartcampus.repository.auth_notification.UserRepository;
import com.smartcampus.repository.notification.NotificationRepository;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void notifyAdmins(String title, String message, String type) {
        List<Long> adminIds = userRepository.findAllByRole(Role.ADMIN).stream()
                .map(admin -> admin.getId())
                .toList();

        notifyUsers(adminIds, title, message, type);
    }

    @Override
    @Transactional
    public void notifyUsers(Collection<Long> userIds, String title, String message, String type) {
        Set<Long> recipientIds = new LinkedHashSet<>();
        if (userIds != null) {
            for (Long userId : userIds) {
                if (userId != null) {
                    recipientIds.add(userId);
                }
            }
        }

        if (recipientIds.isEmpty()) {
            log.info("Skipping notification creation because no recipients are available");
            return;
        }

        List<Notification> notifications = recipientIds.stream()
                .map(recipientId -> Notification.builder()
                        .userId(recipientId)
                        .title(title)
                        .message(message)
                        .type(type)
                        .isRead(false)
                        .build())
                .toList();

        for (Notification notification : notifications) {
            notificationRepository.save(java.util.Objects.requireNonNull(notification, "Notification is required"));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getMyNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public NotificationResponseDTO markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        notification.setRead(true);
        return toDto(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        for (Notification notification : unreadNotifications) {
            notification.setRead(true);
        }
        for (Notification notification : unreadNotifications) {
            notificationRepository.save(java.util.Objects.requireNonNull(notification, "Notification is required"));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    private NotificationResponseDTO toDto(Notification notification) {
        return new NotificationResponseDTO(
                notification.getId(),
                notification.getUserId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getUpdatedAt());
    }
}