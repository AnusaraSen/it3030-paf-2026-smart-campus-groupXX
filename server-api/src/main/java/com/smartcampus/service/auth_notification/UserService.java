package com.smartcampus.service.auth_notification;

import java.util.List;

import com.smartcampus.dto.auth_notification.AuthResponseDTO;
import com.smartcampus.dto.auth_notification.LoginRequestDTO;
import com.smartcampus.dto.auth_notification.UserRequestDTO;
import com.smartcampus.dto.auth_notification.UserResponseDTO;
import com.smartcampus.dto.auth_notification.UserUpdateRequestDTO;

public interface UserService {

    UserResponseDTO register(UserRequestDTO request);

    AuthResponseDTO login(LoginRequestDTO request);

    UserResponseDTO getById(Long id, String requesterEmail, boolean requesterIsAdmin);

    List<UserResponseDTO> getAll();

    UserResponseDTO update(Long id, UserUpdateRequestDTO request, String requesterEmail, boolean requesterIsAdmin);

    void delete(Long id);
}
