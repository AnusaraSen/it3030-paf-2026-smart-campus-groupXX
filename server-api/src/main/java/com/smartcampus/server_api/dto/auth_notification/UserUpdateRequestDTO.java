package com.smartcampus.server_api.dto.auth_notification;

import com.smartcampus.server_api.model.auth_notification.Role;
import com.smartcampus.server_api.validation.CampusEmail;
import com.smartcampus.server_api.validation.StrongPassword;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateRequestDTO(
        @NotBlank @Size(max = 50) String firstName,
        @NotBlank @Size(max = 50) String lastName,
        @NotBlank @Email @Size(max = 100) @CampusEmail String email,
        @Size(max = 72) @StrongPassword String password,
        Role role
) {
}
