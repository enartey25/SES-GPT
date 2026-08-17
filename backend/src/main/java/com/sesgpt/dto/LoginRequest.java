package com.sesgpt.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    /** Accepts student/staff ID or email */
    @NotBlank private String identifier;
    @NotBlank private String password;
}
