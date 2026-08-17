package com.sesgpt.controller;

import com.sesgpt.model.NotificationEntity;
import com.sesgpt.model.User;
import com.sesgpt.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<NotificationEntity>> getNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String studentId) {

        String targetStudentId = studentId;
        if (targetStudentId == null && user != null) {
            targetStudentId = user.getStudentId();
        }

        if (targetStudentId != null && !targetStudentId.isBlank()) {
            return ResponseEntity.ok(notificationRepository.findByStudentIdOrderByCreatedAtDesc(targetStudentId));
        }

        if (user != null && user.getId() != null) {
            return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
        }

        return ResponseEntity.ok(notificationRepository.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable UUID id) {
        return notificationRepository.findById(id)
                .map(n -> {
                    n.setIsRead(true);
                    notificationRepository.save(n);
                    return ResponseEntity.ok(Map.of("success", true, "id", id));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String studentId) {

        String targetStudentId = studentId;
        if (targetStudentId == null && user != null) {
            targetStudentId = user.getStudentId();
        }

        if (targetStudentId != null && !targetStudentId.isBlank()) {
            notificationRepository.markAllAsReadForStudent(targetStudentId);
        } else {
            List<NotificationEntity> all = notificationRepository.findAll();
            for (NotificationEntity n : all) {
                n.setIsRead(true);
            }
            notificationRepository.saveAll(all);
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "All notifications marked as read"));
    }
}
