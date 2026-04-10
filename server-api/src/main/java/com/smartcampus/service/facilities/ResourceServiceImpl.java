package com.smartcampus.service.facilities;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartcampus.dto.facilities.ResourceAvailabilityWindowDTO;
import com.smartcampus.dto.facilities.ResourceRequestDTO;
import com.smartcampus.dto.facilities.ResourceResponseDTO;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.facilities.Resource;
import com.smartcampus.model.facilities.ResourceAvailabilityWindow;
import com.smartcampus.model.facilities.ResourceStatus;
import com.smartcampus.model.facilities.ResourceType;
import com.smartcampus.repository.facilities.ResourceRepository;

import jakarta.persistence.criteria.Predicate;

@Service
@Transactional
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceServiceImpl(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @Override
    public ResourceResponseDTO create(ResourceRequestDTO request) {
        Resource resource = new Resource();
        applyRequest(resource, request);
        Resource saved = resourceRepository.save(resource);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ResourceResponseDTO getById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        return toResponse(resource);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> search(String q,
            ResourceType type,
            ResourceStatus status,
            Integer minCapacity,
            Integer maxCapacity,
            String location) {

        Specification<Resource> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (minCapacity != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
            }

            if (maxCapacity != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("capacity"), maxCapacity));
            }

            if (location != null && !location.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("location")), like(location)));
            }

            if (q != null && !q.isBlank()) {
                String like = like(q);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("location")), like)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return resourceRepository.findAll(spec).stream().map(this::toResponse).toList();
    }

    @Override
    public ResourceResponseDTO update(Long id, ResourceRequestDTO request) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        applyRequest(resource, request);
        Resource saved = resourceRepository.save(resource);
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found");
        }
        resourceRepository.deleteById(id);
    }

    private void applyRequest(Resource resource, ResourceRequestDTO request) {
        resource.setName(request.name().trim());
        resource.setType(request.type());
        resource.setCapacity(request.capacity());
        resource.setLocation(request.location().trim());
        resource.setStatus(request.status() == null ? ResourceStatus.ACTIVE : request.status());

        resource.getAvailabilityWindows().clear();
        if (request.availabilityWindows() != null) {
            for (ResourceAvailabilityWindowDTO dto : request.availabilityWindows()) {
                ResourceAvailabilityWindow window = new ResourceAvailabilityWindow(
                        resource,
                        dto.dayOfWeek(),
                        dto.startTime(),
                        dto.endTime());
                resource.getAvailabilityWindows().add(window);
            }
        }
    }

    private ResourceResponseDTO toResponse(Resource resource) {
        List<ResourceAvailabilityWindowDTO> windows = resource.getAvailabilityWindows() == null
                ? List.of()
                : resource.getAvailabilityWindows().stream()
                        .map(w -> new ResourceAvailabilityWindowDTO(w.getDayOfWeek(), w.getStartTime(), w.getEndTime()))
                        .toList();

        return new ResourceResponseDTO(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getCapacity(),
                resource.getLocation(),
                resource.getStatus(),
                windows,
                resource.getCreatedAt(),
                resource.getUpdatedAt());
    }

    private static String like(String value) {
        return "%" + value.toLowerCase(Locale.ROOT).trim() + "%";
    }
}

