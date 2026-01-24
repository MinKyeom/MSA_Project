package com.mk.auth_service.dto;

public record SignupResponse(
    String id,
    String username,
    String token
) {}