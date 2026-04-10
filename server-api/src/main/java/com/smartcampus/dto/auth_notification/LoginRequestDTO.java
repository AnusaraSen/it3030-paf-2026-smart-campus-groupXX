package com.smartcampus.dto.auth_notification;

import com.smartcampus.validation.CampusEmail;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequestDTO(
        @NotBlank @Email @Size(max = 100) @CampusEmail String email,
        @NotBlank @Size(min = 1, max = 72) String password
) {
}
