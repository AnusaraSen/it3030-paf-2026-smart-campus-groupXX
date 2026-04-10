package com.smartcampus.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.smartcampus.model.auth_notification.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMinutes;

    public JwtService(
            @Value("${JWT_SECRET:ZGU3ZDU2N2E1ZGMwYjA0YjY3OWQ4OTc1M2I5ZjRkMjY0NDVjNDFkNGUyOTVkZTBjYjZlYjQ1M2FlN2YyMQ==}") String base64Secret,
            @Value("${JWT_EXPIRATION_MINUTES:60}") long expirationMinutes) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirationMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(user.getEmail())
                .issuedAt(java.util.Date.from(now))
                .expiration(java.util.Date.from(expiresAt))
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username != null
                && username.equalsIgnoreCase(userDetails.getUsername())
                && !isTokenExpired(token);
    }

    public long getExpirationSeconds() {
        return expirationMinutes * 60L;
    }

    private boolean isTokenExpired(String token) {
        Instant expiration = extractAllClaims(token).getExpiration().toInstant();
        return expiration.isBefore(Instant.now());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

