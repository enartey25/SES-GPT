package com.sesgpt.service;

import com.sesgpt.model.Document;
import com.sesgpt.model.DocumentChunk;
import com.sesgpt.repository.DocumentChunkRepository;
import com.sesgpt.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Handles ingestion of general academic documents (policy PDFs, syllabi, handbooks).
 *
 * Pipeline:
 *   1. Receive raw text (extracted by caller from PDF/DOCX/TXT)
 *   2. Chunk into overlapping windows of ~{chunkSize} tokens
 *   3. Embed each chunk via OpenAI text-embedding-3-small
 *   4. Persist all chunks to document_chunks
 *
 * Used by:
 *   - Admin document upload endpoint (POST /api/documents/upload)
 *   - Seeding scripts that pre-populate the knowledge base
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IngestService {

    private final EmbeddingService embeddingService;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;

    @Value("${rag.chunk-size:512}")
    private int chunkSizeTokens;      // target tokens per chunk (1 token ≈ 4 chars)

    @Value("${rag.chunk-overlap:64}")
    private int overlapTokens;        // overlap between successive chunks

    /**
     * Chunks the document's text, embeds each chunk, and persists to DB.
     *
     * @param document     already-persisted Document entity (id must be non-null)
     * @param rawText      full extracted text of the document
     * @return             updated document with chunk count
     */
    @Transactional
    public Document ingestText(Document document, String rawText) {
        List<String> chunks = chunkText(rawText, chunkSizeTokens, overlapTokens);
        log.info("Ingesting doc='{}' → {} chunks", document.getTitle(), chunks.size());

        List<DocumentChunk> entities = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            String chunkText = chunks.get(i);
            float[] embedding = embeddingService.embed(chunkText);

            entities.add(DocumentChunk.builder()
                    .document(document)
                    .chunkIndex(i)
                    .content(chunkText)
                    .tokenCount(chunkText.length() / 4)
                    .embedding(embedding)
                    .department(document.getDepartment())
                    .scope(document.getScope())
                    .build());
        }

        chunkRepository.saveAll(entities);
        log.info("Persisted {} chunks for document '{}'", entities.size(), document.getTitle());
        return document;
    }

    // ── Text Chunking ──────────────────────────────────────────────────────────

    /**
     * Splits text into overlapping windows by character count (proxy for tokens).
     * chunkSizeChars  = chunkSizeTokens  * 4
     * overlapChars    = overlapTokens    * 4
     *
     * Attempts to split on sentence boundaries (". ") to avoid cutting mid-sentence.
     */
    private List<String> chunkText(String text, int chunkTokens, int overlapTokens) {
        int chunkChars   = chunkTokens   * 4;
        int overlapChars = overlapTokens * 4;

        List<String> result = new ArrayList<>();
        int start = 0;

        while (start < text.length()) {
            int end = Math.min(start + chunkChars, text.length());

            // Try to snap to a sentence boundary within a 200-char lookahead window
            if (end < text.length()) {
                int snapEnd = text.lastIndexOf(". ", end);
                if (snapEnd > start + chunkChars / 2) {
                    end = snapEnd + 2; // include the period and space
                }
            }

            String chunk = text.substring(start, end).trim();
            if (!chunk.isEmpty()) {
                result.add(chunk);
            }

            // Advance start, stepping back by overlap
            start = end - overlapChars;
            if (start <= 0) start = end; // avoid infinite loop on very short text
        }

        return result;
    }
}
