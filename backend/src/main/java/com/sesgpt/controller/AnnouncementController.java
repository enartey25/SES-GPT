package com.sesgpt.controller;

import com.sesgpt.model.Announcement;
import com.sesgpt.model.NotificationEntity;
import com.sesgpt.model.User;
import com.sesgpt.repository.AnnouncementRepository;
import com.sesgpt.repository.NotificationRepository;
import com.sesgpt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementRepository announcementRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Announcement>> getAnnouncements() {
        return ResponseEntity.ok(announcementRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping
    public ResponseEntity<?> broadcastAnnouncement(
            @AuthenticationPrincipal User authUser,
            @RequestBody AnnouncementRequest request) {

        if (request.title() == null || request.title().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Announcement title is required"));
        }
        if (request.body() == null || request.body().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Announcement body is required"));
        }

        String senderName = request.senderName() != null ? request.senderName() : (authUser != null ? authUser.getName() : "Faculty Broadcast");
        String senderRole = request.senderRole() != null ? request.senderRole() : (authUser != null ? authUser.getRole().name().toLowerCase() : "lecturer");
        UUID senderId = authUser != null ? authUser.getId() : null;

        Announcement announcement = Announcement.builder()
                .title(request.title())
                .body(request.body())
                .senderId(senderId)
                .senderName(senderName)
                .senderRole(senderRole)
                .targetSchool(request.targetSchool() != null ? request.targetSchool() : "School of Engineering Sciences")
                .targetDepartment(request.targetDepartment() != null ? request.targetDepartment() : "Computer Engineering")
                .targetLevels(request.targetLevels() != null ? request.targetLevels() : List.of())
                .targetRoles(request.targetRoles() != null ? request.targetRoles() : List.of())
                .targetStudentIds(request.targetStudentIds() != null ? request.targetStudentIds() : List.of())
                .reachCount(request.reachCount() != null ? request.reachCount() : 0)
                .build();

        Announcement savedAnnouncement = announcementRepository.save(announcement);

        // Deliver Notification records in database for matching users
        List<User> allUsers = userRepository.findAll();
        Set<String> recipientStudentIds = new HashSet<>();

        // 1. Explicit Student IDs targeted
        if (request.targetStudentIds() != null) {
            for (String sid : request.targetStudentIds()) {
                if (sid != null && !sid.isBlank()) {
                    recipientStudentIds.add(sid.trim());
                }
            }
        }

        // 2. Target matching registered users in PostgreSQL
        List<NotificationEntity> notificationsToSave = new ArrayList<>();

        for (User u : allUsers) {
            boolean roleMatch = request.targetRoles() == null || request.targetRoles().isEmpty() ||
                    request.targetRoles().contains(u.getRole().name().toLowerCase());

            boolean deptMatch = request.targetDepartment() == null ||
                    request.targetDepartment().equalsIgnoreCase("All SES Departments") ||
                    (u.getDepartment() != null && u.getDepartment().equalsIgnoreCase(request.targetDepartment()));

            boolean levelMatch = request.targetLevels() == null || request.targetLevels().isEmpty() ||
                    u.getLevel() == null || request.targetLevels().contains(u.getLevel());

            boolean explicitIdMatch = request.targetStudentIds() != null &&
                    (request.targetStudentIds().contains(u.getStudentId()) || request.targetStudentIds().contains(u.getId().toString()));

            if (explicitIdMatch || (roleMatch && deptMatch && levelMatch)) {
                recipientStudentIds.add(u.getStudentId());
                notificationsToSave.add(NotificationEntity.builder()
                        .announcementId(savedAnnouncement.getId())
                        .userId(u.getId())
                        .studentId(u.getStudentId())
                        .title(savedAnnouncement.getTitle())
                        .body(savedAnnouncement.getBody())
                        .senderName(senderName)
                        .senderRole(senderRole)
                        .department(savedAnnouncement.getTargetDepartment())
                        .isRead(false)
                        .build());
            }
        }

        // Also ensure any explicit studentId without a full User account gets a notification entry
        for (String sid : recipientStudentIds) {
            boolean alreadyAdded = notificationsToSave.stream().anyMatch(n -> sid.equalsIgnoreCase(n.getStudentId()));
            if (!alreadyAdded) {
                notificationsToSave.add(NotificationEntity.builder()
                        .announcementId(savedAnnouncement.getId())
                        .studentId(sid)
                        .title(savedAnnouncement.getTitle())
                        .body(savedAnnouncement.getBody())
                        .senderName(senderName)
                        .senderRole(senderRole)
                        .department(savedAnnouncement.getTargetDepartment())
                        .isRead(false)
                        .build());
            }
        }

        if (!notificationsToSave.isEmpty()) {
            notificationRepository.saveAll(notificationsToSave);
        }

        log.info("Broadcasted announcement '{}' (ID: {}) delivered to {} recipients",
                savedAnnouncement.getTitle(), savedAnnouncement.getId(), notificationsToSave.size());

        return ResponseEntity.ok(Map.of(
                "announcement", savedAnnouncement,
                "deliveredCount", notificationsToSave.size()
        ));
    }

    public record AnnouncementRequest(
            String title,
            String body,
            String senderName,
            String senderRole,
            String targetSchool,
            String targetDepartment,
            List<String> targetLevels,
            List<String> targetRoles,
            List<String> targetStudentIds,
            Integer reachCount
    ) {}
}
