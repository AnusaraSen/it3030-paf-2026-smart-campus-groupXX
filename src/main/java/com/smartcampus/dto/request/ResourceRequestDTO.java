// FILE: src/main/java/com/smartcampus/dto/request/ResourceRequestDTO.java
package com.smartcampus.dto.request;

import com.smartcampus.model.Resource.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

/**
 * DTO for creating or updating a Resource.
 */
public class ResourceRequestDTO {

    @NotBlank(message = "Name must not be blank")
    private String name;

    @NotNull(message = "Type must not be null")
    private ResourceType type;

    @Min(value = 1, message = "Capacity must be greater than 0")
    private int capacity;

    private String location;

    private LocalTime availableFrom;

    private LocalTime availableTo;

    private String description;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ResourceType getType() { return type; }
    public void setType(ResourceType type) { this.type = type; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public LocalTime getAvailableFrom() { return availableFrom; }
    public void setAvailableFrom(LocalTime availableFrom) { this.availableFrom = availableFrom; }

    public LocalTime getAvailableTo() { return availableTo; }
    public void setAvailableTo(LocalTime availableTo) { this.availableTo = availableTo; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
