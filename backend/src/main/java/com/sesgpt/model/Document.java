package com.sesgpt.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents an ingested source document (academic PDF, syllabus, policy doc)
 * or a user-uploaded WhatsApp export.
 *
 * Each Document has 1..N DocumentChunk rows that hold the actual embeddings.
 */
@Entity
@Table(name = "documents")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    /**
     * UPLOADED_FILE   — admin-uploaded academic document
     * WHATSAPP_EXPORT — user-uploaded WhatsApp .txt
     * SYSTEM          — seeded from the institution's knowledge base
     */
    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType;

    /** User who uploaded this document (null for SYSTEM docs) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    /** Restricts retrieval to users of this department (null = school-wide) */
    @Column(length = 120)
    private String department;

    /**
     * DEPARTMENT  — visible to users in `department`
     * SCHOOL      — visible to all users
     * PERSONAL    — visible only to the owner (WhatsApp sessions)
     */
    @Builder.Default
    @Column(nullable = false, length = 50)
    private String scope = "DEPARTMENT";

    @Column(name = "file_name", length = 255)
    private String fileName;

    /** Raw text — optional; chunked content lives in document_chunks */
    @Column(columnDefinition = "TEXT")
    private String content;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DocumentChunk> chunks = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
