package com.beeacademy.backend.service;

import com.beeacademy.backend.dto.request.LoginRequest;
import com.beeacademy.backend.dto.request.RegisterRequest;
import com.beeacademy.backend.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
