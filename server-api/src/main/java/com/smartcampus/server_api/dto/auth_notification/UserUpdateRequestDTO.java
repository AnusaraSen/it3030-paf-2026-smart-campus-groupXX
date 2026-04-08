package com.smartcampus.server_api.dto.auth_notification;

import com.smartcampus.server_api.model.auth_notification.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UserUpdateRequestDTO(
        @Size(max = 50) String firstName,
        @Size(max = 50) String lastName,
        @Email @Size(max = 100) String email,
        @Size(min = 8, max = 72) String password,
        Role role
) {
}
