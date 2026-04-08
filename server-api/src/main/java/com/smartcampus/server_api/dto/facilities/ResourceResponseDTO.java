package com.smartcampus.server_api.dto.facilities;

import java.time.LocalDateTime;
import java.util.List;

import com.smartcampus.server_api.model.facilities.ResourceStatus;
import com.smartcampus.server_api.model.facilities.ResourceType;

public record ResourceResponseDTO(
        Long id,
        String name,
        ResourceType type,
        Integer capacity,
        String location,
        ResourceStatus status,
        List<ResourceAvailabilityWindowDTO> availabilityWindows,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
