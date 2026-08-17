package com.sesgpt.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "announcements")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "sender_id")
    private UUID senderId;

    @Column(name = "sender_name", nullable = false, length = 255)
    private String senderName;

    @Column(name = "sender_role", nullable = false, length = 50)
    private String senderRole;

    @Column(name = "target_school", nullable = false, length = 255)
    private String targetSchool;

    @Column(name = "target_department", nullable = false, length = 255)
    private String targetDepartment;

    @Column(name = "target_levels")
    private List<String> targetLevels;

    @Column(name = "target_roles")
    private List<String> targetRoles;

    @Column(name = "target_student_ids")
    private List<String> targetStudentIds;

    @Column(name = "reach_count")
    private Integer reachCount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
