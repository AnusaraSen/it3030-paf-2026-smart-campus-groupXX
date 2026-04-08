package com.smartcampus.server_api.security;

import java.io.IOException;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.smartcampus.server_api.model.auth_notification.Role;
import com.smartcampus.server_api.model.auth_notification.User;
import com.smartcampus.server_api.repository.auth_notification.UserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final String frontendRedirectUrl;

    public OAuth2SuccessHandler(JwtUtil jwtUtil, UserRepository userRepository,
            @Value("${OAUTH_SUCCESS_REDIRECT_URL:http://localhost:3000/oauth-success}") String frontendRedirectUrl) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.frontendRedirectUrl = frontendRedirectUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {

        if (!(authentication instanceof OAuth2AuthenticationToken oauth2AuthenticationToken)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "OAuth2 authentication is required.");
            return;
        }

        String email = oauth2AuthenticationToken.getPrincipal().getAttribute("email");
        if (email == null || email.isBlank()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Google account did not return an email address.");
            return;
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String displayName = oauth2AuthenticationToken.getPrincipal().getAttribute("name");
        String picture = oauth2AuthenticationToken.getPrincipal().getAttribute("picture");

        User user = userRepository.findByEmail(normalizedEmail)
            .orElseGet(() -> createGoogleUser(normalizedEmail, displayName, picture));

        Role effectiveRole = normalizeRole(user.getRole());
        if (user.getRole() != effectiveRole) {
            user.setRole(effectiveRole);
            user = userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user);

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendRedirectUrl)
                .queryParam("token", token)
                .build(true)
                .toUriString();

        response.sendRedirect(redirectUrl);
    }

    private static Role normalizeRole(Role role) {
        if (role == null || role == Role.USERS) {
            return Role.USER;
        }

        return role;
    }

    private User createGoogleUser(String email, String displayName, String picture) {
        User user = new User();
        NameParts nameParts = splitName(displayName, email);

        user.setEmail(email);
        user.setFirstName(nameParts.firstName());
        user.setLastName(nameParts.lastName());
        user.setName(composeDisplayName(nameParts));
        user.setPicture(picture);
        user.setProvider("GOOGLE");
        user.setRole(Role.USER);
        user.setPassword("GOOGLE_AUTHENTICATED");

        return userRepository.save(user);
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

        String localPart = email == null ? "" : email.trim();
        if (localPart.contains("@")) {
            localPart = localPart.substring(0, localPart.indexOf('@'));
        }

        if (localPart.isBlank()) {
            return new NameParts("Google", "User");
        }

        String[] tokens = localPart.replace('.', ' ').replace('_', ' ').replace('-', ' ').trim().split("\\s+");
        String firstName = tokens.length > 0 ? capitalize(tokens[0]) : "Google";
        String lastName = tokens.length > 1 ? capitalize(tokens[tokens.length - 1]) : "User";
        return new NameParts(firstName, lastName);
    }

    private static String composeDisplayName(NameParts nameParts) {
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

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
    }

    private record NameParts(String firstName, String lastName) {}
}