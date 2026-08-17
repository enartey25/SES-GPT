package com.sesgpt.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Intelligent Typo Correction Service.
 * Uses Levenshtein edit distance and academic/institutional domain dictionary
 * to match misspelled query words with the closest valid terms.
 */
@Service
@Slf4j
public class TypoCorrectionService {

    // Pre-loaded canonical dictionary of academic terms, course vocabulary, and common query words
    private static final Set<String> BASE_DICTIONARY = Set.of(
            // High-priority academic triggers
            "quiz", "quizzes", "ia", "exam", "exams", "examination", "examinations",
            "class", "classes", "assignment", "assignments", "project", "projects",
            "homework", "midsem", "midsemester", "finals", "lecture", "lectures",
            "tutorial", "tutorials", "lab", "labs", "practical", "practicals",
            "defense", "presentation", "presentations", "syllabus", "handbook",

            // Scheduling, venues, deadlines
            "deadline", "deadlines", "due", "submit", "submission", "submissions",
            "venue", "venues", "schedule", "schedules", "scheduled", "reschedule", "rescheduled",
            "postpone", "postponed", "cancel", "cancelled", "location", "room", "hall",
            "today", "tomorrow", "yesterday", "monday", "tuesday", "wednesday", "thursday",
            "friday", "saturday", "sunday", "morning", "afternoon", "evening",

            // University & academic hierarchy
            "department", "faculty", "school", "engineering", "sciences", "university", "ghana",
            "lecturer", "professor", "instructor", "teaching", "assistant", "rep", "representative",
            "hod", "dean", "student", "students", "announcement", "announcements", "notice",
            "grade", "grades", "marks", "results", "score", "attendance", "course", "courses",

            // Engineering departments & UG course prefixes
            "cpen", "fpen", "bmen", "aren", "mten", "seng", "math", "dcit", "ug",
            "computer", "biomedical", "agricultural", "materials", "food",

            // Common question/action words
            "prepare", "preparation", "update", "updates", "information", "details",
            "link", "slides", "notes", "material", "recording", "solution", "solutions"
    );

    private final Set<String> dynamicVocabulary = ConcurrentHashMap.newKeySet();

    public TypoCorrectionService() {
        dynamicVocabulary.addAll(BASE_DICTIONARY);
    }

    /**
     * Registers additional dynamic vocabulary (e.g. from document titles or chat history).
     */
    public void registerVocabulary(Collection<String> words) {
        if (words == null) return;
        for (String w : words) {
            if (w != null && w.length() >= 3) {
                dynamicVocabulary.add(w.toLowerCase(Locale.ROOT));
            }
        }
    }

    /**
     * Corrects all detectable typos in a user query string while preserving word order and punctuation structure.
     */
    public String correctQuery(String query) {
        if (query == null || query.isBlank()) return query;

        Pattern wordPattern = Pattern.compile("(?i)[a-z0-9]+");
        Matcher matcher = wordPattern.matcher(query);
        StringBuilder sb = new StringBuilder();

        while (matcher.find()) {
            String token = matcher.group();
            String corrected = findClosestMatch(token);
            // Preserve capitalization if original was capitalized
            if (Character.isUpperCase(token.charAt(0)) && !corrected.isEmpty()) {
                corrected = Character.toUpperCase(corrected.charAt(0)) + (corrected.length() > 1 ? corrected.substring(1) : "");
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(corrected));
        }
        matcher.appendTail(sb);

        String result = sb.toString();
        if (!result.equalsIgnoreCase(query)) {
            log.info("Typo correction: \"{}\" -> \"{}\"", query, result);
        }
        return result;
    }

    /**
     * Finds the closest dictionary word for a given token using Levenshtein distance.
     * Returns the original token if no sufficiently close match exists or if already valid.
     */
    public String findClosestMatch(String token) {
        if (token == null || token.isBlank()) return token;
        String lower = token.toLowerCase(Locale.ROOT).trim();

        // Exact match in dictionary or very short word (< 3 chars, except 'ia')
        if (dynamicVocabulary.contains(lower)) {
            return token;
        }
        if (lower.length() < 3 && !lower.equals("ia")) {
            return token;
        }

        // Determine max allowed edit distance based on token length
        int maxAllowedDistance;
        if (lower.length() <= 4) {
            maxAllowedDistance = 1;
        } else if (lower.length() <= 8) {
            maxAllowedDistance = 2;
        } else {
            maxAllowedDistance = 3;
        }

        String bestMatch = null;
        int bestDistance = Integer.MAX_VALUE;
        int bestPrefixMatch = -1;

        for (String candidate : dynamicVocabulary) {
            // Quick length filter: if lengths differ by more than maxAllowedDistance, skip
            if (Math.abs(candidate.length() - lower.length()) > maxAllowedDistance) {
                continue;
            }

            int dist = computeLevenshteinDistance(lower, candidate);
            if (dist <= maxAllowedDistance) {
                int prefixLen = commonPrefixLength(lower, candidate);
                // Prefer lower distance, or break tie with longer common prefix and similar length
                if (dist < bestDistance || (dist == bestDistance && prefixLen > bestPrefixMatch)) {
                    bestDistance = dist;
                    bestMatch = candidate;
                    bestPrefixMatch = prefixLen;
                }
            }
        }

        return (bestMatch != null) ? bestMatch : token;
    }

    /**
     * Classical Wagner-Fischer algorithm for Levenshtein edit distance.
     */
    public static int computeLevenshteinDistance(String s1, String s2) {
        int len1 = s1.length();
        int len2 = s2.length();

        int[] prevRow = new int[len2 + 1];
        int[] currRow = new int[len2 + 1];

        for (int j = 0; j <= len2; j++) {
            prevRow[j] = j;
        }

        for (int i = 1; i <= len1; i++) {
            currRow[0] = i;
            char c1 = s1.charAt(i - 1);
            for (int j = 1; j <= len2; j++) {
                char c2 = s2.charAt(j - 1);
                int cost = (c1 == c2) ? 0 : 1;
                currRow[j] = Math.min(
                        Math.min(currRow[j - 1] + 1, prevRow[j] + 1), // Insertion / Deletion
                        prevRow[j - 1] + cost                         // Substitution
                );
            }
            System.arraycopy(currRow, 0, prevRow, 0, len2 + 1);
        }

        return prevRow[len2];
    }

    private int commonPrefixLength(String s1, String s2) {
        int minLen = Math.min(s1.length(), s2.length());
        int prefix = 0;
        for (int i = 0; i < minLen; i++) {
            if (s1.charAt(i) == s2.charAt(i)) prefix++;
            else break;
        }
        return prefix;
    }
}
