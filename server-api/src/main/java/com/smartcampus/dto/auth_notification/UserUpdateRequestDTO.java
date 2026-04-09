package com.smartcampus.dto.auth_notification;

import com.smartcampus.model.auth_notification.Role;
import com.smartcampus.validation.CampusEmail;
import com.smartcampus.validation.StrongPassword;

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
