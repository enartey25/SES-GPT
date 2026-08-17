package com.sesgpt.repository;

import com.sesgpt.model.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {

    /**
     * Semantic search using pgvector cosine distance.
     */
    @Query(value = """
            SELECT dc.*
            FROM   document_chunks dc
            WHERE  (dc.department = :department OR dc.scope = 'SCHOOL')
              AND  1 - (dc.embedding <=> CAST(:embeddingStr AS vector)) >= :threshold
            ORDER  BY dc.embedding <=> CAST(:embeddingStr AS vector)
            LIMIT  :topK
            """, nativeQuery = true)
    List<DocumentChunk> findSimilarChunks(
            @Param("embeddingStr") String embeddingStr,
            @Param("department")  String department,
            @Param("threshold")   double threshold,
            @Param("topK")        int topK
    );

    /**
     * WhatsApp-session scoped vector similarity search.
     */
    @Query(value = """
            SELECT dc.*
            FROM   document_chunks dc
            WHERE  dc.document_id = :documentId
            ORDER  BY dc.embedding <=> CAST(:embeddingStr AS vector)
            LIMIT  :topK
            """, nativeQuery = true)
    List<DocumentChunk> findSimilarInDocument(
            @Param("embeddingStr") String embeddingStr,
            @Param("documentId")  UUID documentId,
            @Param("topK")        int topK
    );

    /**
     * Keyword search within a document (for names, course codes, dates, terms).
     */
    @Query(value = """
            SELECT dc.*
            FROM   document_chunks dc
            WHERE  dc.document_id = :documentId
              AND  LOWER(dc.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
            ORDER  BY dc.chunk_index DESC
            LIMIT  :topK
            """, nativeQuery = true)
    List<DocumentChunk> findKeywordInDocument(
            @Param("documentId") UUID documentId,
            @Param("keyword")    String keyword,
            @Param("topK")       int topK
    );

    /**
     * Fetch most recent chunks in document for latest context awareness.
     */
    @Query(value = """
            SELECT dc.*
            FROM   document_chunks dc
            WHERE  dc.document_id = :documentId
            ORDER  BY dc.chunk_index DESC
            LIMIT  :topK
            """, nativeQuery = true)
    List<DocumentChunk> findLatestInDocument(
            @Param("documentId") UUID documentId,
            @Param("topK")       int topK
    );

    List<DocumentChunk> findByDocument_IdOrderByChunkIndex(UUID documentId);
}
