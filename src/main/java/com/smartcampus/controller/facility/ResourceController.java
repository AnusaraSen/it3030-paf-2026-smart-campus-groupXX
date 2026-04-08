// FILE: src/main/java/com/smartcampus/controller/facility/ResourceController.java
package com.smartcampus.controller.facility;

import com.smartcampus.dto.request.ResourceRequestDTO;
import com.smartcampus.dto.response.ResourceResponseDTO;
import com.smartcampus.model.Resource.ResourceType;
import com.smartcampus.service.facility.ResourceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for Facilities & Assets Catalogue endpoints.
 * No business logic here — all delegation goes to {@link ResourceService}.
 */
@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    // ── POST /api/resources ───────────────────────────────────────────────────

    /**
     * Creates a new resource. ADMIN only.
     *
     * @param dto validated request body
     * @return 201 Created with the created resource
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponseDTO> createResource(
            @Valid @RequestBody ResourceRequestDTO dto) {

        ResourceResponseDTO created = resourceService.createResource(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── GET /api/resources ────────────────────────────────────────────────────

    /**
     * Returns a paginated, filtered list of active resources.
     * Accessible by all authenticated users.
     *
     * @param type     optional type filter (e.g. LAB)
     * @param capacity optional minimum capacity filter
     * @param location optional location keyword filter
     * @param page     zero-based page index (default 0)
     * @param size     page size (default 10)
     * @return 200 OK with a page of resources
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<ResourceResponseDTO>> getAllResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ResourceResponseDTO> result =
                resourceService.getAllResources(type, capacity, location, pageable);
        return ResponseEntity.ok(result);
    }

    // ── GET /api/resources/{id} ───────────────────────────────────────────────

    /**
     * Returns a single resource by ID.
     * Accessible by all authenticated users.
     *
     * @param id resource identifier
     * @return 200 OK or 404 Not Found
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResourceResponseDTO> getResourceById(@PathVariable Long id) {
        ResourceResponseDTO resource = resourceService.getResourceById(id);
        return ResponseEntity.ok(resource);
    }

    // ── PUT /api/resources/{id} ───────────────────────────────────────────────

    /**
     * Updates an existing resource. ADMIN only.
     *
     * @param id  resource identifier
     * @param dto fields to update
     * @return 200 OK with the updated resource
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponseDTO> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ResourceRequestDTO dto) {

        ResourceResponseDTO updated = resourceService.updateResource(id, dto);
        return ResponseEntity.ok(updated);
    }

    // ── DELETE /api/resources/{id} ────────────────────────────────────────────

    /**
     * Soft-deletes a resource. ADMIN only.
     * Sets isDeleted = true and status = OUT_OF_SERVICE; no DB row is removed.
     *
     * @param id resource identifier
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
