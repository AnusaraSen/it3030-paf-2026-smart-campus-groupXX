package com.smartcampus.server_api.controller.facilities;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.server_api.dto.ApiMessageResponseDTO;
import com.smartcampus.server_api.dto.facilities.ResourceRequestDTO;
import com.smartcampus.server_api.dto.facilities.ResourceResponseDTO;
import com.smartcampus.server_api.model.facilities.ResourceStatus;
import com.smartcampus.server_api.model.facilities.ResourceType;
import com.smartcampus.server_api.service.facilities.ResourceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @PostMapping
    public ResponseEntity<ResourceResponseDTO> create(@Valid @RequestBody ResourceRequestDTO request) {
        ResourceResponseDTO created = resourceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<ResourceResponseDTO>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Integer maxCapacity,
            @RequestParam(required = false) String location) {

        return ResponseEntity.ok(resourceService.search(q, type, status, minCapacity, maxCapacity, location));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> update(@PathVariable Long id, @Valid @RequestBody ResourceRequestDTO request) {
        return ResponseEntity.ok(resourceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiMessageResponseDTO> delete(@PathVariable Long id) {
        resourceService.delete(id);
        return ResponseEntity.ok(ApiMessageResponseDTO.of("Resource deleted"));
    }
}
