package com.sesgpt.repository;

import com.sesgpt.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByStudentId(String studentId);
    Optional<User> findByEmail(String email);
    boolean existsByStudentId(String studentId);
    boolean existsByEmail(String email);
}
