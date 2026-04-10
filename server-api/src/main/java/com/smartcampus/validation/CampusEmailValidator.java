package com.smartcampus.validation;

import java.util.Locale;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CampusEmailValidator implements ConstraintValidator<CampusEmail, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }

        return value.trim().toLowerCase(Locale.ROOT).endsWith("@campus.com");
    }
}
