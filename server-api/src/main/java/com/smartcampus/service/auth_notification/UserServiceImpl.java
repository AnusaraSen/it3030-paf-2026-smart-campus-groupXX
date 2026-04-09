package com.smartcampus.service.auth_notification;

import java.util.List;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartcampus.dto.auth_notification.AuthResponseDTO;
import com.smartcampus.dto.auth_notification.LoginRequestDTO;
import com.smartcampus.dto.auth_notification.UserRequestDTO;
import com.smartcampus.dto.auth_notification.UserResponseDTO;
import com.smartcampus.dto.auth_notification.UserUpdateRequestDTO;
import com.smartcampus.exception.DuplicateResourceException;
import com.smartcampus.exception.ForbiddenOperationException;
import com.smartcampus.exception.InvalidCredentialsException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.auth_notification.Role;
import com.smartcampus.model.auth_notification.User;
import com.smartcampus.repository.auth_notification.UserRepository;
import com.smartcampus.security.JwtService;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public UserServiceImpl(UserRepository userRepository,
            AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Override
    public UserResponseDTO register(UserRequestDTO request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email is already registered");
        }

        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setName(buildDisplayName(request.firstName(), request.lastName()));
        user.setEmail(request.email().toLowerCase());
        user.setProvider("LOCAL");
        user.setPassword(passwordEncoder.encode(request.password()));

        // For self-registration, default to USERS.
        user.setRole(Role.USERS);

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponseDTO login(LoginRequestDTO request) {
        String normalizedEmail = request.email().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException());

        boolean passwordMatches = false;
        try {
            passwordMatches = passwordEncoder.matches(request.password(), user.getPassword());
        } catch (RuntimeException ignored) {
            passwordMatches = false;
        }

        if (!passwordMatches && user.getPassword() != null
                && (user.getPassword().startsWith("$2a$")
                        || user.getPassword().startsWith("$2b$")
                        || user.getPassword().startsWith("$2y$"))) {
            passwordMatches = new BCryptPasswordEncoder().matches(request.password(), user.getPassword());
        }

        if (!passwordMatches) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user);
        return new AuthResponseDTO("Bearer", token, jwtService.getExpirationSeconds(), toResponse(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDTO getById(Long id, String requesterEmail, boolean requesterIsAdmin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!requesterIsAdmin && (requesterEmail == null || !user.getEmail().equalsIgnoreCase(requesterEmail))) {
            throw new ForbiddenOperationException("You are not allowed to access this user");
        }

        return toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public UserResponseDTO update(Long id, UserUpdateRequestDTO request, String requesterEmail, boolean requesterIsAdmin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!requesterIsAdmin && (requesterEmail == null || !user.getEmail().equalsIgnoreCase(requesterEmail))) {
            throw new ForbiddenOperationException("You are not allowed to update this user");
        }

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        user.setName(buildDisplayName(user.getFirstName(), user.getLastName()));
        if (request.email() != null) {
            String normalizedEmail = request.email().toLowerCase();
            if (!normalizedEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(normalizedEmail)) {
                throw new DuplicateResourceException("Email is already registered");
            }
            user.setEmail(normalizedEmail);
        }
        if (request.password() != null) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        if (request.role() != null) {
            if (!requesterIsAdmin) {
                throw new ForbiddenOperationException("Only ADMIN can change roles");
            }
            user.setRole(request.role());
        }

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found");
        }
        userRepository.deleteById(id);
    }

    private UserResponseDTO toResponse(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }

    private static String buildDisplayName(String firstName, String lastName) {
        String normalizedFirstName = firstName == null ? "" : firstName.trim();
        String normalizedLastName = lastName == null ? "" : lastName.trim();

        if (normalizedFirstName.isEmpty() && normalizedLastName.isEmpty()) {
            return null;
        }

        return (normalizedFirstName + " " + normalizedLastName).trim().replaceAll("\\s+", " ");
    }
}

