package com.smartcampus.service.notification;

import java.util.Collection;
import java.util.List;

import com.smartcampus.dto.notification.NotificationResponseDTO;

public interface NotificationService {

    void notifyAdmins(String title, String message, String type);

    void notifyUsers(Collection<Long> userIds, String title, String message, String type);

    List<NotificationResponseDTO> getMyNotifications(Long userId);

    NotificationResponseDTO markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);

    long getUnreadCount(Long userId);
}