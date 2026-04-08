// FILE: src/main/java/com/smartcampus/service/facility/ResourceService.java
package com.smartcampus.service.facility;

import com.smartcampus.dto.request.ResourceRequestDTO;
import com.smartcampus.dto.response.ResourceResponseDTO;
import com.smartcampus.model.Resource.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service contract for Facilities & Assets Catalogue operations.
 */
public interface ResourceService {

    /**
     * Creates a new resource with ACTIVE status.
     *
     * @param dto validated request body
     * @return the persisted resource as a response DTO
     */
    ResourceResponseDTO createResource(ResourceRequestDTO dto);

    /**
     * Returns a paginated, optionally filtered list of non-deleted resources.
     *
     * @param type     optional type filter
     * @param capacity optional minimum-capacity filter
     * @param location optional location keyword filter
     * @param pageable pagination parameters
     * @return page of matching resources
     */
    Page<ResourceResponseDTO> getAllResources(ResourceType type, Integer capacity,
                                             String location, Pageable pageable);

    /**
     * Retrieves a single non-deleted resource by its ID.
     *
     * @param id resource identifier
     * @return the resource as a response DTO
     * @throws com.smartcampus.exception.ResourceNotFoundException if not found or soft-deleted
     */
    ResourceResponseDTO getResourceById(Long id);

    /**
     * Partially updates allowed fields of an existing resource.
     *
     * @param id  resource identifier
     * @param dto fields to update
     * @return the updated resource as a response DTO
     * @throws com.smartcampus.exception.ResourceNotFoundException if not found or soft-deleted
     */
    ResourceResponseDTO updateResource(Long id, ResourceRequestDTO dto);

    /**
     * Soft-deletes a resource by marking it as deleted and OUT_OF_SERVICE.
     *
     * @param id resource identifier
     * @throws com.smartcampus.exception.ResourceNotFoundException if not found or already deleted
     */
    void deleteResource(Long id);
}
