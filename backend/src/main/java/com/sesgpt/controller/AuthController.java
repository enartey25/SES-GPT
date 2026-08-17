package com.sesgpt.controller;

import com.sesgpt.dto.LoginRequest;
import com.sesgpt.dto.RegisterRequest;
import com.sesgpt.model.Role;
import com.sesgpt.model.User;
import com.sesgpt.repository.UserRepository;
import com.sesgpt.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * POST /api/auth/register — create account (pending institutional verification)
 * POST /api/auth/login    — sign in, returns JWT
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * Register a new user.
     * Account is created with verified=false and active=true.
     * An admin must verify the institutional ID before the user can log in
     * (or set verified=true automatically after ID check — implement in UserService).
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByStudentId(req.getStudentId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "An account with this ID already exists."));
        }
        if (req.getEmail() != null && userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email is already associated with another account."));
        }

        User user = User.builder()
                .studentId(req.getStudentId())
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.valueOf(req.getRole().toUpperCase()))
                .department(req.getDepartment())
                .level(req.getLevel())
                .verified(false)
                .active(true)
                .build();

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Registration submitted. Awaiting institutional verification.",
                        "studentId", user.getStudentId()
                ));
    }

    /**
     * Sign in with student/staff ID or email + password.
     * Returns a JWT on success.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        // Resolve user by ID or email
        User user = userRepository.findByStudentId(req.getIdentifier())
                .or(() -> userRepository.findByEmail(req.getIdentifier()))
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials."));

        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Account is suspended. Contact your administrator."));
        }
        if (!user.isVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Account pending verification. Check your email for updates."));
        }
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials.");
        }

        String token = jwtUtil.generateToken(user);
        return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", user.getId(),
                "name",   user.getName(),
                "role",   user.getRole().name(),
                "department", user.getDepartment()
        ));
    }

    /**
     * Change password — authenticated endpoint.
     * Body: { "currentPassword": "…", "newPassword": "…" }
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @org.springframework.security.core.annotation.AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {

        String current = body.get("currentPassword");
        String next    = body.get("newPassword");

        if (current == null || next == null || next.length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "New password must be at least 8 characters."));
        }
        if (!passwordEncoder.matches(current, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Current password is incorrect."));
        }

        user.setPassword(passwordEncoder.encode(next));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
    }
}
