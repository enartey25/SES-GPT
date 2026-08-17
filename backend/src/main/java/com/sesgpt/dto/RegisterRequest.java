package com.sesgpt.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank private String studentId;
    @NotBlank private String name;
    private String email;
    @NotBlank private String password;
    @NotBlank private String role;        // "STUDENT" | "TA" | "LECTURER" | "HOD" | "DEAN" | "ADMIN"
    @NotBlank private String department;
    private String level;                 // L100–L500 / Graduate — students only
}
