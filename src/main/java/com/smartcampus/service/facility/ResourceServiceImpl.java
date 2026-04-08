// FILE: src/main/java/com/smartcampus/service/facility/ResourceServiceImpl.java
package com.smartcampus.service.facility;

import com.smartcampus.dto.request.ResourceRequestDTO;
import com.smartcampus.dto.response.ResourceResponseDTO;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Resource;
import com.smartcampus.model.Resource.ResourceStatus;
import com.smartcampus.model.Resource.ResourceType;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of {@link ResourceService}.
 * All business logic lives here; the controller layer is kept thin.
 */
@Service
@Transactional
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceServiceImpl(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * {@inheritDoc}
     */
    @Override
    public ResourceResponseDTO createResource(ResourceRequestDTO dto) {
        Resource resource = mapToEntity(dto);
        resource.setStatus(ResourceStatus.ACTIVE);
        resource.setDeleted(false);
        Resource saved = resourceRepository.save(resource);
        return mapToResponseDTO(saved);
    }

    // ── Read (list) ───────────────────────────────────────────────────────────

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public Page<ResourceResponseDTO> getAllResources(ResourceType type, Integer capacity,
                                                    String location, Pageable pageable) {
        return resourceRepository
                .findAllFiltered(type, capacity, location, pageable)
                .map(this::mapToResponseDTO);
    }

    // ── Read (single) ─────────────────────────────────────────────────────────

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public ResourceResponseDTO getResourceById(Long id) {
        Resource resource = findActiveResourceById(id);
        return mapToResponseDTO(resource);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /**
     * {@inheritDoc}
     * Only status, availableFrom, availableTo, capacity and description are
     * updated — name, type and location are intentionally excluded as per spec.
     */
    @Override
    public ResourceResponseDTO updateResource(Long id, ResourceRequestDTO dto) {
        Resource resource = findActiveResourceById(id);

        if (dto.getAvailableFrom() != null) {
            resource.setAvailableFrom(dto.getAvailableFrom());
        }
        if (dto.getAvailableTo() != null) {
            resource.setAvailableTo(dto.getAvailableTo());
        }
        if (dto.getCapacity() > 0) {
            resource.setCapacity(dto.getCapacity());
        }
        if (dto.getDescription() != null) {
            resource.setDescription(dto.getDescription());
        }

        Resource updated = resourceRepository.save(resource);
        return mapToResponseDTO(updated);
    }

    // ── Soft Delete ───────────────────────────────────────────────────────────

    /**
     * {@inheritDoc}
     */
    @Override
    public void deleteResource(Long id) {
        Resource resource = findActiveResourceById(id);
        resource.setDeleted(true);
        resource.setStatus(ResourceStatus.OUT_OF_SERVICE);
        resourceRepository.save(resource);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Looks up a resource by ID, throwing {@link ResourceNotFoundException}
     * if it does not exist or has been soft-deleted.
     */
    private Resource findActiveResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resource not found with id: " + id));

        if (resource.isDeleted()) {
            throw new ResourceNotFoundException(
                    "Resource not found with id: " + id);
        }
        return resource;
    }

    /**
     * Maps a {@link ResourceRequestDTO} to a new {@link Resource} entity.
     */
    private Resource mapToEntity(ResourceRequestDTO dto) {
        Resource resource = new Resource();
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCapacity(dto.getCapacity());
        resource.setLocation(dto.getLocation());
        resource.setAvailableFrom(dto.getAvailableFrom());
        resource.setAvailableTo(dto.getAvailableTo());
        resource.setDescription(dto.getDescription());
        return resource;
    }

    /**
     * Maps a {@link Resource} entity to a {@link ResourceResponseDTO}.
     */
    private ResourceResponseDTO mapToResponseDTO(Resource resource) {
        ResourceResponseDTO dto = new ResourceResponseDTO();
        dto.setId(resource.getId());
        dto.setName(resource.getName());
        dto.setType(resource.getType());
        dto.setCapacity(resource.getCapacity());
        dto.setLocation(resource.getLocation());
        dto.setAvailableFrom(resource.getAvailableFrom());
        dto.setAvailableTo(resource.getAvailableTo());
        dto.setStatus(resource.getStatus());
        dto.setDescription(resource.getDescription());
        return dto;
    }
}
