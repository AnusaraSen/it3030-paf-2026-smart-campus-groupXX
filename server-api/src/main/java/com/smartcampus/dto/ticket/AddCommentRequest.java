package com.smartcampus.dto.ticket;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AddCommentRequest {

    @NotBlank(message = "Comment message is required")
    @Size(max = 500, message = "Comment must not exceed 500 characters")
    private String message;
}