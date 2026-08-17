package com.sesgpt.controller;

import com.sesgpt.dto.ChatRequest;
import com.sesgpt.dto.ChatResponse;
import com.sesgpt.model.User;
import com.sesgpt.service.RagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * POST /api/chat          — General RAG query (department-scoped)
 * POST /api/chat/whatsapp — WhatsApp document RAG query
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final RagService ragService;

    /**
     * General academic knowledge base query.
     * The authenticated user's department is used to filter retrievable chunks.
     */
    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChatRequest request) {

        ChatResponse response = ragService.query(request.getQuestion(), user);
        return ResponseEntity.ok(response);
    }

    /**
     * Query against a previously uploaded WhatsApp export.
     * documentId identifies the document created during upload.
     */
    @PostMapping("/whatsapp")
    public ResponseEntity<ChatResponse> chatWhatsApp(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChatRequest request) {

        if (request.getDocumentId() == null) {
            return ResponseEntity.badRequest().build();
        }

        ChatResponse response = ragService.queryWhatsApp(request.getQuestion(), request.getDocumentId());
        return ResponseEntity.ok(response);
    }
}
