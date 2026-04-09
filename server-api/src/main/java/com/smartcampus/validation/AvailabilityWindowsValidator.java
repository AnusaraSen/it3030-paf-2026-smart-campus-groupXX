package com.smartcampus.validation;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import com.smartcampus.dto.facilities.ResourceAvailabilityWindowDTO;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class AvailabilityWindowsValidator implements ConstraintValidator<AvailabilityWindows, List<ResourceAvailabilityWindowDTO>> {

    @Override
    public boolean isValid(List<ResourceAvailabilityWindowDTO> value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true;
        }

        Map<DayOfWeek, List<ResourceAvailabilityWindowDTO>> byDay = new EnumMap<>(DayOfWeek.class);
        for (ResourceAvailabilityWindowDTO window : value) {
            if (window == null) {
                return false;
            }
            if (window.dayOfWeek() == null || window.startTime() == null || window.endTime() == null) {
                return false;
            }
            if (!window.endTime().isAfter(window.startTime())) {
                return false;
            }
            byDay.computeIfAbsent(window.dayOfWeek(), day -> new ArrayList<>()).add(window);
        }

        for (Map.Entry<DayOfWeek, List<ResourceAvailabilityWindowDTO>> entry : byDay.entrySet()) {
            List<ResourceAvailabilityWindowDTO> windows = entry.getValue();
            windows.sort(Comparator.comparing(ResourceAvailabilityWindowDTO::startTime));

            for (int i = 1; i < windows.size(); i++) {
                ResourceAvailabilityWindowDTO previous = windows.get(i - 1);
                ResourceAvailabilityWindowDTO current = windows.get(i);
                if (current.startTime().isBefore(previous.endTime())) {
                    return false;
                }
            }
        }

        return true;
    }
}

