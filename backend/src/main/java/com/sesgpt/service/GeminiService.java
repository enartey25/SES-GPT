package com.sesgpt.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiService {

    private final String apiKey;
    private final String primaryChatModel;
    private final String embeddingModel;
    private final int embeddingDimensions;
    private final double temperature;
    private final int maxTokens;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private static final List<String> FALLBACK_MODELS = List.of(
            "gemini-3-flash-preview",
            "gemini-3.5-flash",
            "gemini-flash-latest",
            "gemini-2.5-flash"
    );

    public GeminiService(
            @Value("${gemini.api-key:}") String apiKey,
            @Value("${gemini.chat-model:gemini-3-flash-preview}") String chatModel,
            @Value("${gemini.embedding-model:gemini-embedding-001}") String embeddingModel,
            @Value("${gemini.embedding-dimensions:1536}") int embeddingDimensions,
            @Value("${gemini.temperature:0.2}") double temperature,
            @Value("${gemini.max-tokens:2048}") int maxTokens,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.primaryChatModel = chatModel != null && !chatModel.isBlank() ? chatModel.trim() : "gemini-3-flash-preview";
        this.embeddingModel = embeddingModel != null ? embeddingModel.trim() : "gemini-embedding-001";
        this.embeddingDimensions = embeddingDimensions;
        this.temperature = temperature;
        this.maxTokens = maxTokens;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    /**
     * Generates embedding via API or returns empty array on quota exhaustion.
     */
    public float[] embed(String text) {
        if (apiKey.isBlank()) return new float[embeddingDimensions];

        try {
            String url = String.format(
                    "https://generativelanguage.googleapis.com/v1beta/models/%s:embedContent?key=%s",
                    embeddingModel, apiKey);

            Map<String, Object> bodyMap = new HashMap<>();
            bodyMap.put("model", "models/" + embeddingModel);
            bodyMap.put("content", Map.of("parts", List.of(Map.of("text", text.trim()))));
            bodyMap.put("outputDimensionality", embeddingDimensions);

            String requestJson = objectMapper.writeValueAsString(bodyMap);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode valuesNode = root.path("embedding").path("values");
                if (valuesNode.isArray() && !valuesNode.isEmpty()) {
                    float[] embedding = new float[valuesNode.size()];
                    for (int i = 0; i < valuesNode.size(); i++) {
                        embedding[i] = (float) valuesNode.get(i).asDouble();
                    }
                    return embedding;
                }
            }
        } catch (Exception e) {
            log.warn("Gemini embedding API call skipped: {}", e.getMessage());
        }
        return new float[embeddingDimensions];
    }

    /**
     * Calls Gemini Chat Completion with full error transparency and model fallback.
     */
    public String generateChatAnswer(String systemPrompt, String userPrompt) {
        if (apiKey.isBlank()) {
            throw new RuntimeException("No GEMINI_API_KEY set in .env. Please add your Google Gemini API key to .env and restart.");
        }

        List<String> modelsToTry = new java.util.ArrayList<>();
        modelsToTry.add(primaryChatModel);
        for (String m : FALLBACK_MODELS) {
            if (!modelsToTry.contains(m)) {
                modelsToTry.add(m);
            }
        }

        String lastError = "";
        for (String modelName : modelsToTry) {
            try {
                String url = String.format(
                        "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                        modelName, apiKey);

                log.info("Sending request to Google Gemini API [model={}, keyLength={}]", modelName, apiKey.length());

                Map<String, Object> bodyMap = new HashMap<>();

                if (systemPrompt != null && !systemPrompt.isBlank()) {
                    bodyMap.put("system_instruction", Map.of(
                            "parts", List.of(Map.of("text", systemPrompt))
                    ));
                }

                bodyMap.put("contents", List.of(
                        Map.of("parts", List.of(Map.of("text", userPrompt)))
                ));

                bodyMap.put("generationConfig", Map.of(
                        "temperature", temperature,
                        "maxOutputTokens", maxTokens
                ));

                String requestJson = objectMapper.writeValueAsString(bodyMap);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(30))
                        .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                log.info("Google Gemini API response status for {}: {}", modelName, response.statusCode());

                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode candidate = root.path("candidates").path(0);
                    JsonNode textParts = candidate.path("content").path("parts");

                    if (textParts.isArray() && !textParts.isEmpty()) {
                        StringBuilder sb = new StringBuilder();
                        for (JsonNode part : textParts) {
                            if (part.has("text")) {
                                sb.append(part.path("text").asText());
                            }
                        }
                        return sb.toString().trim();
                    }
                    throw new RuntimeException("Gemini returned empty candidate content: " + response.body());
                }

                // If 404 model not found, try next model in fallback list
                if (response.statusCode() == 404) {
                    lastError = "Google Gemini model " + modelName + " not found (404).";
                    log.warn("Gemini model {} returned 404, trying alternate fallback model...", modelName);
                    continue;
                }

                // Report other errors immediately
                log.error("Google Gemini API error (status {}): {}", response.statusCode(), response.body());
                throw new RuntimeException("Google Gemini API error (status " + response.statusCode() + "): " + response.body());

            } catch (Exception e) {
                if (e.getMessage() != null && e.getMessage().contains("404")) {
                    lastError = e.getMessage();
                    continue;
                }
                log.error("Gemini API call failed: {}", e.getMessage(), e);
                throw new RuntimeException(e.getMessage(), e);
            }
        }

        throw new RuntimeException("All candidate Gemini models failed. Last error: " + lastError);
    }
}
