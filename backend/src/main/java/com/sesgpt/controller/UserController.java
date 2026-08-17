package com.sesgpt.controller;

import com.sesgpt.model.Role;
import com.sesgpt.model.User;
import com.sesgpt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Admin & self-service user management endpoints.
 *
 * GET    /api/users               — list all users (Admin only)
 * GET    /api/users/me            — current user's profile
 * PUT    /api/users/{id}/verify   — approve registration (Admin)
 * PUT    /api/users/{id}/suspend  — suspend account (Admin)
 * PUT    /api/users/{id}/reinstate — reinstate suspended account (Admin)
 * PUT    /api/users/{id}/role     — change a user's role (Admin)
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Current user ──────────────────────────────────────────────────────────

    /** Returns the profile of the authenticated user */
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(toProfile(user));
    }

    // ── Admin: list all users ─────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<?>> listUsers(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {

        List<User> users = userRepository.findAll(Sort.by("createdAt").descending());

        var filtered = users.stream()
                .filter(u -> department == null || u.getDepartment().equalsIgnoreCase(department))
                .filter(u -> role == null       || u.getRole().name().equalsIgnoreCase(role))
                .filter(u -> {
                    if (status == null) return true;
                    return switch (status.toLowerCase()) {
                        case "pending"   -> !u.isVerified() && u.isActive();
                        case "suspended" -> !u.isActive();
                        case "active"    -> u.isVerified() && u.isActive();
                        default          -> true;
                    };
                })
                .map(this::toProfile)
                .toList();

        return ResponseEntity.ok(filtered);
    }

    // ── Admin: account actions ────────────────────────────────────────────────

    private java.util.Optional<User> findByIdOrStudentId(String idStr) {
        try {
            UUID uuid = UUID.fromString(idStr);
            var byId = userRepository.findById(uuid);
            if (byId.isPresent()) return byId;
        } catch (Exception ignored) {}
        return userRepository.findByStudentId(idStr);
    }

    /**
     * Approve a pending registration — sets verified=true.
     * In production, this should also trigger a welcome email.
     */
    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> verify(@PathVariable String id) {
        return findByIdOrStudentId(id).map(u -> {
            u.setVerified(true);
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "User verified.", "userId", u.getId(), "studentId", u.getStudentId()));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Suspend an account — sets active=false.
     * Suspended users cannot log in (AuthController checks active flag).
     */
    @PutMapping("/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> suspend(@PathVariable String id,
                                     @AuthenticationPrincipal User admin) {
        return findByIdOrStudentId(id).map(u -> {
            if (u.getId().equals(admin.getId()) || u.getStudentId().equalsIgnoreCase(admin.getStudentId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot suspend your own account."));
            }
            u.setActive(false);
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "User suspended.", "userId", u.getId(), "studentId", u.getStudentId()));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Reinstate a suspended account — sets active=true */
    @PutMapping("/{id}/reinstate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reinstate(@PathVariable String id) {
        return findByIdOrStudentId(id).map(u -> {
            u.setActive(true);
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "User reinstated.", "userId", u.getId(), "studentId", u.getStudentId()));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Change a user's role (e.g. promote a student to TA).
     * Body: { "role": "TA" }
     */
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changeRole(@PathVariable String id,
                                        @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        if (roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "role field is required."));
        }
        Role newRole;
        try {
            newRole = Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleStr));
        }

        return findByIdOrStudentId(id).map(u -> {
            u.setRole(newRole);
            userRepository.save(u);
            return ResponseEntity.ok(Map.of(
                    "message", "Role updated.",
                    "userId",  u.getId(),
                    "studentId", u.getStudentId(),
                    "newRole", newRole.name()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Self-service profile update (Name, Department, Level, Avatar Photo)
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> updates) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        var userOpt = userRepository.findById(currentUser.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User u = userOpt.get();
        if (updates.containsKey("name") && updates.get("name") != null) {
            u.setName(updates.get("name").toString().trim());
        }
        if (updates.containsKey("email") && updates.get("email") != null) {
            u.setEmail(updates.get("email").toString().trim());
        }
        if (updates.containsKey("department") && updates.get("department") != null) {
            u.setDepartment(updates.get("department").toString());
        }
        if (updates.containsKey("level") && updates.get("level") != null) {
            u.setLevel(updates.get("level").toString());
        }
        if (updates.containsKey("avatarUrl")) {
            u.setAvatarUrl(updates.get("avatarUrl") != null ? updates.get("avatarUrl").toString() : null);
        }

        userRepository.save(u);
        return ResponseEntity.ok(toProfile(u));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Map<String, Object> toProfile(User u) {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", u.getId());
        map.put("studentId", u.getStudentId());
        map.put("name", u.getName());
        map.put("email", u.getEmail() != null ? u.getEmail() : "");
        map.put("role", u.getRole().name());
        map.put("department", u.getDepartment());
        map.put("level", u.getLevel() != null ? u.getLevel() : "");
        map.put("avatarUrl", u.getAvatarUrl() != null ? u.getAvatarUrl() : "");
        map.put("verified", u.isVerified());
        map.put("active", u.isActive());
        map.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt() : java.time.OffsetDateTime.now());
        return map;
    }
}
