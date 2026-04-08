package com.smartcampus.server_api.service.facilities;

import java.util.List;

import com.smartcampus.server_api.dto.facilities.ResourceRequestDTO;
import com.smartcampus.server_api.dto.facilities.ResourceResponseDTO;
import com.smartcampus.server_api.model.facilities.ResourceStatus;
import com.smartcampus.server_api.model.facilities.ResourceType;

public interface ResourceService {
    ResourceResponseDTO create(ResourceRequestDTO request);

    ResourceResponseDTO getById(Long id);

    List<ResourceResponseDTO> search(String q,
            ResourceType type,
            ResourceStatus status,
            Integer minCapacity,
            Integer maxCapacity,
            String location);

    ResourceResponseDTO update(Long id, ResourceRequestDTO request);

    void delete(Long id);
}
