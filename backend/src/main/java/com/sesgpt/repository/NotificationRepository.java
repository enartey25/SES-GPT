package com.sesgpt.repository;

import com.sesgpt.model.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<NotificationEntity, UUID> {
    List<NotificationEntity> findByStudentIdOrderByCreatedAtDesc(String studentId);
    List<NotificationEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<NotificationEntity> findAllByOrderByCreatedAtDesc();

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.isRead = true WHERE n.studentId = :studentId")
    void markAllAsReadForStudent(@Param("studentId") String studentId);
}
