package com.sesgpt.service;

import com.sesgpt.model.Document;
import com.sesgpt.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Noise-Filtered WhatsApp & Document Parser.
 * Strips chatter, media placeholders, deleted messages, and system notices
 * to distill 100% pure high-signal academic content for the neural embedding model.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppParserService {

    private final EmbeddingService embeddingService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${rag.chunk-size:512}")
    private int targetTokens;

    private static final int CHUNK_LINES = 35; // clean informative messages per chunk

    // Universal WhatsApp message header patterns:
    private static final Pattern ANDROID_PATTERN = Pattern.compile(
            "^\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4},\\s*\\d{1,2}:\\d{2}(?::\\d{2})?\\s*(?:[APap][Mm])?\\s*-\\s*[^:]+:.+$"
    );
    private static final Pattern IOS_PATTERN = Pattern.compile(
            "^\\[\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4},\\s*\\d{1,2}:\\d{2}(?::\\d{2})?\\s*(?:[APap][Mm])?\\]\\s*[^:]+:.+$"
    );

    // Noise filtering patterns:
    private static final Pattern SYSTEM_NOTICE_PATTERN = Pattern.compile(
            "(?i)(Messages and calls are end-to-end encrypted|joined using a group link|joined using this group|left the group|added|removed|changed the subject|changed the group description|security code changed|waiting for this message)"
    );

    private static final Pattern MEDIA_NOISE_PATTERN = Pattern.compile(
            "(?i)(\\u200E?<media omitted>|sticker omitted|image omitted|video omitted|audio omitted|document omitted|This message was deleted|You deleted this message)"
    );

    private static final Set<String> CHATTER_WORDS = Set.of(
            "ok", "okay", "k", "kk", "yh", "yeah", "yes", "no", "nope", "lol", "lmao", "eii", "eiii",
            "hmm", "hmmm", "yoo", "yo", "charley", "chale", "boss", "please", "pls", "true", "fr",
            "frfr", "right", "sure", "alright", "noted", "thanks", "thx", "ty", "done", "cool", "die",
            "herh", "ah", "oo", "ooo", "oooo", "yess", "yessir", "same", "bet"
    );

    private boolean isMessageHeader(String line) {
        if (line == null || line.isBlank()) return false;
        String clean = line.replaceAll("[\\u200E\\u200F\\u202A-\\u202E\\u202F\\u00A0]", " ").trim();
        return ANDROID_PATTERN.matcher(clean).matches() || IOS_PATTERN.matcher(clean).matches();
    }

    /**
     * Filters out non-informative noise (stickers, deleted messages, single-word chatter, system joins).
     */
    private boolean isInformativeMessage(String message) {
        if (message == null || message.isBlank()) return false;

        if (SYSTEM_NOTICE_PATTERN.matcher(message).find()) return false;
        if (MEDIA_NOISE_PATTERN.matcher(message).find()) return false;

        int colonIdx = message.indexOf(": ");
        String body = (colonIdx != -1) ? message.substring(colonIdx + 2).trim() : message.trim();

        // Strip non-alphanumeric chars to evaluate word content
        String cleanBody = body.replaceAll("[^a-zA-Z0-9\\s]", " ").trim().toLowerCase(Locale.ROOT);
        if (cleanBody.isBlank()) return false; // emoji-only or symbol-only

        String[] words = cleanBody.split("\\s+");
        // If message is 1-2 words and only contains chatter filler, skip it
        if (words.length <= 2) {
            boolean allChatter = true;
            for (String w : words) {
                if (!CHATTER_WORDS.contains(w) && w.length() > 2) {
                    allChatter = false;
                    break;
                }
            }
            if (allChatter) return false;
        }

        return true;
    }

    private String extractRawText(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (filename.endsWith(".zip")) {
            StringBuilder sb = new StringBuilder();
            try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
                ZipEntry entry;
                while ((entry = zis.getNextEntry()) != null) {
                    if (!entry.isDirectory()) {
                        String name = entry.getName().toLowerCase();
                        if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv") || name.contains("chat")) {
                            BufferedReader br = new BufferedReader(new InputStreamReader(zis, StandardCharsets.UTF_8));
                            String line;
                            while ((line = br.readLine()) != null) {
                                sb.append(line).append("\n");
                            }
                        }
                    }
                    zis.closeEntry();
                }
            }
            return sb.toString();
        } else {
            return new String(file.getBytes(), StandardCharsets.UTF_8);
        }
    }

    private record RawChunk(UUID id, UUID documentId, int chunkIndex, String content, int tokenCount, String vectorStr, String department, String scope) {}

    @Transactional
    public Document parseAndEmbed(MultipartFile file, User owner, Document savedDocument) throws Exception {
        long startTime = System.currentTimeMillis();
        String fullRawText = extractRawText(file);
        if (fullRawText.isBlank()) {
            log.warn("Extracted empty text from file '{}'", file.getOriginalFilename());
            return savedDocument;
        }

        // Store full original text permanently in documents table
        try {
            jdbcTemplate.update("UPDATE documents SET content = ? WHERE id = ?", fullRawText, savedDocument.getId());
            savedDocument.setContent(fullRawText);
        } catch (Exception e) {
            log.warn("Could not update raw content on document {}: {}", savedDocument.getId(), e.getMessage());
        }

        List<String> rawMessages = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new StringReader(fullRawText))) {
            StringBuilder current = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                if (isMessageHeader(line)) {
                    if (!current.isEmpty()) {
                        rawMessages.add(current.toString().trim());
                        current = new StringBuilder();
                    }
                    current.append(line);
                } else if (!current.isEmpty()) {
                    current.append(" ").append(line.trim());
                }
            }
            if (!current.isEmpty()) rawMessages.add(current.toString().trim());
        }

        // Noise filtering step: retain only informative messages
        List<String> cleanMessages = new ArrayList<>();
        int filteredNoiseCount = 0;

        for (String msg : rawMessages) {
            if (isInformativeMessage(msg)) {
                cleanMessages.add(msg);
            } else {
                filteredNoiseCount++;
            }
        }

        log.info("WhatsApp processing: {} total messages parsed -> {} high-signal messages retained (filtered out {} noise lines)",
                rawMessages.size(), cleanMessages.size(), filteredNoiseCount);

        List<RawChunk> chunks = new ArrayList<>();
        int idx = 0;
        String dept = owner != null ? owner.getDepartment() : "General";

        if (cleanMessages.size() >= 2) {
            int step = Math.max(1, CHUNK_LINES - 8);
            for (int i = 0; i < cleanMessages.size(); i += step) {
                List<String> window = cleanMessages.subList(i, Math.min(i + CHUNK_LINES, cleanMessages.size()));
                String chunkText = String.join("\n", window);

                float[] embedding = embeddingService.embed(chunkText);
                String vectorStr = EmbeddingService.toVectorString(embedding);

                chunks.add(new RawChunk(
                        UUID.randomUUID(),
                        savedDocument.getId(),
                        idx++,
                        chunkText,
                        chunkText.length() / 4,
                        vectorStr,
                        dept,
                        "PERSONAL"
                ));

                if (i + CHUNK_LINES >= cleanMessages.size()) break;
            }
        } else {
            // General text chunking
            int chunkSizeChars = Math.max(800, targetTokens * 4);
            int stepChars = Math.max(500, chunkSizeChars - 256);

            for (int start = 0; start < fullRawText.length(); start += stepChars) {
                int end = Math.min(start + chunkSizeChars, fullRawText.length());
                String chunkText = fullRawText.substring(start, end).trim();
                if (!chunkText.isEmpty()) {
                    float[] embedding = embeddingService.embed(chunkText);
                    String vectorStr = EmbeddingService.toVectorString(embedding);

                    chunks.add(new RawChunk(
                            UUID.randomUUID(),
                            savedDocument.getId(),
                            idx++,
                            chunkText,
                            chunkText.length() / 4,
                            vectorStr,
                            dept,
                            "PERSONAL"
                    ));
                }
                if (end >= fullRawText.length()) break;
            }
        }

        // High-speed JDBC Batch Insert
        if (!chunks.isEmpty()) {
            String sql = """
                INSERT INTO document_chunks (id, document_id, chunk_index, content, token_count, embedding, department, scope, created_at)
                VALUES (?, ?, ?, ?, ?, CAST(? AS vector), ?, ?, ?)
            """;

            Timestamp now = Timestamp.from(Instant.now());
            jdbcTemplate.batchUpdate(sql, chunks, 100, (PreparedStatement ps, RawChunk chunk) -> {
                ps.setObject(1, chunk.id());
                ps.setObject(2, chunk.documentId());
                ps.setInt(3, chunk.chunkIndex());
                ps.setString(4, chunk.content());
                ps.setInt(5, chunk.tokenCount());
                ps.setString(6, chunk.vectorStr());
                ps.setString(7, chunk.department());
                ps.setString(8, chunk.scope());
                ps.setTimestamp(9, now);
            });
        }

        long elapsed = System.currentTimeMillis() - startTime;
        log.info("Successfully vectorized and indexed {} dense high-signal chunks for '{}' in {} ms",
                chunks.size(), savedDocument.getTitle(), elapsed);

        return savedDocument;
    }
}
