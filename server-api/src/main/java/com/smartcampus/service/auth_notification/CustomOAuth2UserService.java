package com.smartcampus.service.auth_notification;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.smartcampus.model.auth_notification.Role;
import com.smartcampus.model.auth_notification.User;
import com.smartcampus.repository.auth_notification.UserRepository;

@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private static final String GOOGLE = "google";
    private static final String USERNAME_ATTRIBUTE = "email";

    private final DefaultOAuth2UserService defaultOAuth2UserService = new DefaultOAuth2UserService();
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = defaultOAuth2UserService.loadUser(userRequest);

        if (!GOOGLE.equalsIgnoreCase(userRequest.getClientRegistration().getRegistrationId())) {
            return oauth2User;
        }

        Map<String, Object> attributes = new HashMap<>(oauth2User.getAttributes());
        String email = valueAsString(attributes.get("email"));
        String name = valueAsString(attributes.get("name"));
        String picture = valueAsString(attributes.get("picture"));
        Boolean emailVerified = valueAsBoolean(attributes.get("email_verified"));
        NameParts nameParts = splitName(name, email);

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(new OAuth2Error("invalid_email"), "Google account did not provide an email address.");
        }

        if (emailVerified != null && !emailVerified) {
            throw new OAuth2AuthenticationException(new OAuth2Error("email_not_verified"), "Google email address is not verified.");
        }

        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseGet(User::new);

        if (user.getId() == null) {
            user.setFirstName(nameParts.firstName());
            user.setLastName(nameParts.lastName());
            user.setEmail(email.toLowerCase());
            user.setName(composeDisplayName(nameParts));
            user.setPicture(picture);
            user.setProvider("GOOGLE");
            user.setRole(Role.USER);
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user = userRepository.save(user);
        } else {
            if (user.getFirstName() == null || user.getFirstName().isBlank()) {
                user.setFirstName(nameParts.firstName());
            }
            if (user.getLastName() == null || user.getLastName().isBlank()) {
                user.setLastName(nameParts.lastName());
            }
            if (user.getName() == null || user.getName().isBlank()) {
                user.setName(composeDisplayName(nameParts));
            }
            if (user.getPicture() == null || user.getPicture().isBlank()) {
                user.setPicture(picture);
            }
            if (user.getProvider() == null || user.getProvider().isBlank()) {
                user.setProvider("GOOGLE");
            }

            user = userRepository.save(user);
        }

        Role effectiveRole = normalizeRole(user.getRole());
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + effectiveRole.name());

        return new DefaultOAuth2User(Collections.singleton(authority), attributes, USERNAME_ATTRIBUTE);
    }

    private static String valueAsString(Object value) {
        return value == null ? null : value.toString();
    }

    private static Boolean valueAsBoolean(Object value) {
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }

        if (value == null) {
            return null;
        }

        return Boolean.valueOf(value.toString());
    }

    private static Role normalizeRole(Role role) {
        if (role == null || role == Role.USERS) {
            return Role.USER;
        }

        return role;
    }

    private static NameParts splitName(String fullName, String email) {
        if (fullName != null && !fullName.isBlank()) {
            String trimmedName = fullName.trim();
            int splitIndex = trimmedName.indexOf(' ');

            if (splitIndex > 0 && splitIndex < trimmedName.length() - 1) {
                return new NameParts(trimmedName.substring(0, splitIndex).trim(), trimmedName.substring(splitIndex + 1).trim());
            }

            return new NameParts(trimmedName, trimmedName);
        }

        String fallbackEmail = email == null ? "" : email.trim();
        String localPart = fallbackEmail.contains("@") ? fallbackEmail.substring(0, fallbackEmail.indexOf('@')) : fallbackEmail;
        if (localPart.isBlank()) {
            return new NameParts("Google", "User");
        }

        String[] tokens = localPart.replace('.', ' ').replace('_', ' ').replace('-', ' ').trim().split("\\s+");
        String firstName = tokens.length > 0 && !tokens[0].isBlank() ? capitalize(tokens[0]) : "Google";
        String lastName = tokens.length > 1 ? capitalize(tokens[tokens.length - 1]) : "User";
        return new NameParts(firstName, lastName);
    }

    private static String composeDisplayName(NameParts nameParts) {
        if (nameParts == null) {
            return null;
        }

        String firstName = nameParts.firstName() == null ? "" : nameParts.firstName().trim();
        String lastName = nameParts.lastName() == null ? "" : nameParts.lastName().trim();

        if (firstName.isEmpty() && lastName.isEmpty()) {
            return null;
        }

        return (firstName + " " + lastName).trim();
    }

    private static String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }

        String lowerCaseValue = value.trim().toLowerCase();
        return Character.toUpperCase(lowerCaseValue.charAt(0)) + lowerCaseValue.substring(1);
    }

    private record NameParts(String firstName, String lastName) {}
}