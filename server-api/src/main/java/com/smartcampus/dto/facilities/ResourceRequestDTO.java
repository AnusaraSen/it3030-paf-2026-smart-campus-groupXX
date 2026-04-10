package com.smartcampus.dto.facilities;

import java.util.List;

import com.smartcampus.model.facilities.ResourceStatus;
import com.smartcampus.model.facilities.ResourceType;
import com.smartcampus.validation.AvailabilityWindows;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResourceRequestDTO(
        @NotBlank @Size(max = 100) String name,
        @NotNull ResourceType type,
        @NotNull @Min(1) @Max(10000) Integer capacity,
        @NotBlank @Size(max = 120) String location,
        ResourceStatus status,
        @AvailabilityWindows @Valid List<ResourceAvailabilityWindowDTO> availabilityWindows
) {
}

