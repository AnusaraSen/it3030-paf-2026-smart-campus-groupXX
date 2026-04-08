package com.smartcampus.server_api.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.smartcampus.server_api.model.auth_notification.Role;
import com.smartcampus.server_api.model.auth_notification.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtUtil {

    private final SecretKey signingKey;
    private final long expirationMinutes;

    public JwtUtil(@Value("${JWT_SECRET:ZGU3ZDU2N2E1ZGMwYjA0YjY3OWQ4OTc1M2I5ZjRkMjY0NDVjNDFkNGUyOTVkZTBjYjZlYjQ1M2FlN2YyMQ==}") String base64Secret,
            @Value("${JWT_EXPIRATION_MINUTES:60}") long expirationMinutes) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(String email, Role role) {
        return generateToken(email, role, null, null, null);
    }

    public String generateToken(User user) {
        return generateToken(
                user.getEmail(),
                user.getRole(),
                user.getFirstName(),
                user.getLastName(),
                user.getName());
    }

    private String generateToken(String email, Role role, String firstName, String lastName, String displayName) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirationMinutes, ChronoUnit.MINUTES);

        io.jsonwebtoken.JwtBuilder builder = Jwts.builder()
                .subject(email.toLowerCase())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .claim("email", email.toLowerCase())
                .claim("role", normalizeRole(role));

        if (firstName != null && !firstName.isBlank()) {
            builder.claim("firstName", firstName.trim());
        }
        if (lastName != null && !lastName.isBlank()) {
            builder.claim("lastName", lastName.trim());
        }
        if (displayName != null && !displayName.isBlank()) {
            builder.claim("name", displayName.trim());
        }

        return builder.signWith(signingKey, Jwts.SIG.HS256).compact();
    }

    public boolean validateToken(String token, String email) {
        Claims claims = extractClaims(token);
        String tokenEmail = claims.getSubject();
        return tokenEmail != null
                && tokenEmail.equalsIgnoreCase(email)
                && !isTokenExpired(claims);
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token) {
        Object role = extractClaims(token).get("role");
        return role == null ? "USER" : role.toString();
    }

    private boolean isTokenExpired(Claims claims) {
        return claims.getExpiration() == null || claims.getExpiration().toInstant().isBefore(Instant.now());
    }

    private static String normalizeRole(Role role) {
        if (role == null) {
            return Role.USER.name();
        }

        if (Role.USERS.equals(role)) {
            return Role.USER.name();
        }

        return role.name();
    }
}