package com.sesgpt.repository;

import com.sesgpt.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    /** All documents in a given department (for admin / lecturer views) */
    List<Document> findByDepartmentOrderByCreatedAtDesc(String department);

    /** WhatsApp exports owned by a specific user */
    List<Document> findByOwner_IdAndSourceTypeOrderByCreatedAtDesc(UUID ownerId, String sourceType);

    /** All school-scoped documents (SYSTEM knowledge base) */
    List<Document> findByScopeOrderByCreatedAtDesc(String scope);
}
