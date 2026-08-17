package com.sesgpt.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Array;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * A DocumentChunk stores a single text passage alongside its OpenAI embedding vector.
 * The embedding column uses the pgvector extension type VECTOR(1536).
 * Retrieval is done via cosine similarity using the IVFFlat index.
 */
@Entity
@Table(name = "document_chunks")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "chunk_index", nullable = false)
    private int chunkIndex;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "token_count")
    private Integer tokenCount;

    /**
     * Stored as a float array; mapped to VECTOR(1536) via Hibernate 6.4+ native vector support.
     * hibernate-vector dependency must be on the classpath.
     */
    @Column(name = "embedding")
    @JdbcTypeCode(SqlTypes.VECTOR)
    @Array(length = 1536)
    private float[] embedding;

    @Column(name = "department", length = 120)
    private String department;

    @Builder.Default
    @Column(name = "scope", length = 50, nullable = false)
    private String scope = "DEPARTMENT";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
