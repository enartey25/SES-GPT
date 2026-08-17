package com.sesgpt.controller;

import com.sesgpt.model.Document;
import com.sesgpt.model.User;
import com.sesgpt.repository.DocumentRepository;
import com.sesgpt.service.IngestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Admin-facing document ingestion endpoints.
 *
 * POST   /api/documents/upload       — upload a .txt document and index it
 * GET    /api/documents              — list indexed documents (dept-scoped)
 * DELETE /api/documents/{id}        — remove a document and its chunks
 *
 * Note: For production, add Apache Tika to extract text from PDF/DOCX before ingestion.
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final IngestService ingestService;

    /**
     * Upload a plain-text document and embed it into the knowledge base.
     * Body: multipart with fields:
     *   - file       (.txt, required)
     *   - title      (string, required)
     *   - scope      (DEPARTMENT | SCHOOL, default DEPARTMENT)
     *
     * Admin only. In production, extend to support PDF via Apache Tika.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> upload(
            @AuthenticationPrincipal User admin,
            @RequestParam("file")  MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "scope", defaultValue = "DEPARTMENT") String scope) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty."));
        }

        try {
            String rawText = new String(file.getBytes(), StandardCharsets.UTF_8);

            Document doc = Document.builder()
                    .title(title)
                    .sourceType("UPLOADED_FILE")
                    .owner(admin)
                    .department(admin.getDepartment())
                    .scope(scope.toUpperCase())
                    .fileName(file.getOriginalFilename())
                    .content(rawText)
                    .build();

            doc = documentRepository.save(doc);
            ingestService.ingestText(doc, rawText);

            log.info("Admin {} uploaded document '{}' (scope={})", admin.getStudentId(), title, scope);

            return ResponseEntity.ok(Map.of(
                    "documentId", doc.getId(),
                    "title",      doc.getTitle(),
                    "message",    "Document indexed successfully."
            ));

        } catch (Exception e) {
            log.error("Document upload failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Ingestion failed: " + e.getMessage()));
        }
    }

    /**
     * List documents accessible to the current user (dept-scoped + SCHOOL scope).
     */
    @GetMapping
    public ResponseEntity<?> listDocuments(@AuthenticationPrincipal User user) {
        List<?> docs = documentRepository
                .findByDepartmentOrderByCreatedAtDesc(user.getDepartment())
                .stream()
                .map(d -> Map.of(
                        "id",         d.getId(),
                        "title",      d.getTitle(),
                        "scope",      d.getScope(),
                        "sourceType", d.getSourceType(),
                        "fileName",   d.getFileName() != null ? d.getFileName() : "",
                        "createdAt",  d.getCreatedAt()
                ))
                .toList();

        return ResponseEntity.ok(docs);
    }

    /**
     * Delete a document and all its chunks (cascade).
     * Admin only.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        return documentRepository.findById(id).map(doc -> {
            documentRepository.delete(doc);
            return ResponseEntity.ok(Map.of("message", "Document and chunks deleted.", "id", id));
        }).orElse(ResponseEntity.notFound().build());
    }
}
