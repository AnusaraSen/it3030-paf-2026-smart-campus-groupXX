package com.smartcampus.server_api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }

        boolean hasLength = value.length() >= 8;
        boolean hasUppercase = value.chars().anyMatch(Character::isUpperCase);
        boolean hasNumber = value.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = value.chars().anyMatch(character -> !Character.isLetterOrDigit(character));

        return hasLength && hasUppercase && hasNumber && hasSpecial;
    }
}