package com.sesgpt.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ChatResponse {
    private String answer;
    private List<Source> sources;

    @Data
    @Builder
    public static class Source {
        private UUID chunkId;
        private String title;
        private String chunk;     // short snippet
    }
}
