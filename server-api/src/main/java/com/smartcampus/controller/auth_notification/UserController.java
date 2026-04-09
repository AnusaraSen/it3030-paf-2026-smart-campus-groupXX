package com.smartcampus.controller.auth_notification;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.dto.ApiMessageResponseDTO;
import com.smartcampus.dto.auth_notification.LoginRequestDTO;
import com.smartcampus.dto.auth_notification.UserRequestDTO;
import com.smartcampus.dto.auth_notification.UserResponseDTO;
import com.smartcampus.dto.auth_notification.UserUpdateRequestDTO;
import com.smartcampus.service.auth_notification.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ------------------------
    // Authentication
    // ------------------------

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(userService.login(request));
    }

    // ------------------------
    // User Management
    // ------------------------

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, Authentication authentication) {
        String requesterEmail = authentication.getName();
        boolean requesterIsAdmin = hasRole(authentication, "ROLE_ADMIN");

        return ResponseEntity.ok(userService.getById(id, requesterEmail, requesterIsAdmin));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        List<UserResponseDTO> users = userService.getAll();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequestDTO request,
            Authentication authentication) {
        String requesterEmail = authentication.getName();
        boolean requesterIsAdmin = hasRole(authentication, "ROLE_ADMIN");

        return ResponseEntity.ok(userService.update(id, request, requesterEmail, requesterIsAdmin));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiMessageResponseDTO.of("User deleted"));
    }

    private static boolean hasRole(Authentication authentication, String role) {
        if (authentication == null) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (role.equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
