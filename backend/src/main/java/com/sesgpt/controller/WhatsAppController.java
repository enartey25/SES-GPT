package com.sesgpt.controller;

import com.sesgpt.model.Document;
import com.sesgpt.model.User;
import com.sesgpt.repository.DocumentRepository;
import com.sesgpt.service.WhatsAppParserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

/**
 * POST /api/whatsapp/upload — upload & index a WhatsApp .txt export
 * GET  /api/whatsapp/sessions — list current user's WhatsApp sessions
 * DELETE /api/whatsapp/sessions/{id} — remove a WhatsApp session and its chunks
 */
@RestController
@RequestMapping("/api/whatsapp")
@RequiredArgsConstructor
@Slf4j
public class WhatsAppController {

    private final DocumentRepository documentRepository;
    private final WhatsAppParserService parserService;

    /**
     * Accepts a multipart .txt file (exported WhatsApp chat).
     * Steps:
     *   1. Persist a Document record (WHATSAPP_EXPORT scope=PERSONAL)
     *   2. Parse messages → chunk → embed → store DocumentChunks
     *   3. Return the document ID so the frontend can bind subsequent chat queries
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty."));
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".txt") && !filename.endsWith(".zip"))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only .txt or .zip WhatsApp exports are accepted."));
        }

        log.info("Received WhatsApp upload from user={} file={}", user.getStudentId(), filename);

        try {
            // 1. Persist document stub
            Document doc = Document.builder()
                    .title("WhatsApp: " + filename)
                    .sourceType("WHATSAPP_EXPORT")
                    .owner(user)
                    .department(user.getDepartment())
                    .scope("PERSONAL")
                    .fileName(filename)
                    .build();

            // We need to set createdAt before saving — handled by @CreationTimestamp, so just save:
            doc = documentRepository.save(doc);

            // 2. Parse, chunk, embed, store
            parserService.parseAndEmbed(file, user, doc);

            log.info("WhatsApp document {} indexed with {} chunks", doc.getId(), doc.getChunks().size());

            return ResponseEntity.ok(Map.of(
                    "documentId", doc.getId(),
                    "title",      doc.getTitle(),
                    "message",    "WhatsApp history indexed successfully. You may now query it."
            ));

        } catch (Exception e) {
            log.error("WhatsApp upload failed for user={}: {}", user.getStudentId(), e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to process upload: " + e.getMessage()));
        }
    }

    /**
     * List all WhatsApp sessions (documents) belonging to the current user.
     */
    @GetMapping("/sessions")
    public ResponseEntity<?> listSessions(@AuthenticationPrincipal User user) {
        var sessions = documentRepository
                .findByOwner_IdAndSourceTypeOrderByCreatedAtDesc(user.getId(), "WHATSAPP_EXPORT")
                .stream()
                .map(d -> Map.of(
                        "id",        d.getId(),
                        "title",     d.getTitle(),
                        "fileName",  d.getFileName(),
                        "createdAt", d.getCreatedAt()
                ))
                .toList();
        return ResponseEntity.ok(sessions);
    }

    /**
     * Delete a WhatsApp session and all its chunks (cascade handles chunks).
     */
    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> deleteSession(
            @AuthenticationPrincipal User user,
            @PathVariable java.util.UUID id) {

        return documentRepository.findById(id).map(doc -> {
            if (!doc.getOwner().getId().equals(user.getId())) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "You do not own this session."));
            }
            documentRepository.delete(doc);
            return ResponseEntity.ok(Map.of("message", "Session deleted."));
        }).orElse(ResponseEntity.notFound().build());
    }
}
