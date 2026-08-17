package com.sesgpt.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class ChatRequest {
    @NotBlank(message = "Question must not be blank")
    private String question;

    /** Optional: populated for WhatsApp RAG queries */
    private UUID documentId;
}
