package com.smartcampus.server_api.dto.auth_notification;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequestDTO(
        @NotBlank @Email @Size(max = 100) String email,
        @NotBlank @Size(min = 1, max = 72) String password
) {
}
