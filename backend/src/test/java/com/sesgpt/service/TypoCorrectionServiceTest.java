package com.sesgpt.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TypoCorrectionServiceTest {

    private TypoCorrectionService typoService;

    @BeforeEach
    void setUp() {
        typoService = new TypoCorrectionService();
    }

    @Test
    void testAcademicKeywordTypoCorrection() {
        assertEquals("quiz", typoService.findClosestMatch("qiz"));
        assertEquals("quiz", typoService.findClosestMatch("quizz"));
        assertEquals("exam", typoService.findClosestMatch("exm"));
        assertEquals("class", typoService.findClosestMatch("clas"));
        assertEquals("assignment", typoService.findClosestMatch("asignment"));
        assertEquals("assignment", typoService.findClosestMatch("asignmnt"));
        assertEquals("project", typoService.findClosestMatch("projct"));
        assertEquals("midsem", typoService.findClosestMatch("midsemm"));
        assertEquals("deadline", typoService.findClosestMatch("deadilne"));
        assertEquals("submission", typoService.findClosestMatch("submision"));
    }

    @Test
    void testFullQueryCorrection() {
        String input = "When is the next asignment and qiz for clas?";
        String expected = "When is the next assignment and quiz for class?";
        assertEquals(expected, typoService.correctQuery(input));
    }

    @Test
    void testPreserveCorrectWordsAndCasing() {
        String input = "Is the CPEN Exam scheduled for Tomorrow?";
        String output = typoService.correctQuery(input);
        assertEquals("Is the CPEN Exam scheduled for Tomorrow?", output);
    }
}
