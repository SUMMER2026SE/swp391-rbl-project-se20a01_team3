package com.beeacademy.backend.dto.response;

import com.beeacademy.backend.model.ExamConfig;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StudentExamResponse(
        UUID id,
        UUID courseId,
        Integer slotIndex,
        UUID scopeStartChapterId,
        String scopeStartChapterTitle,
        UUID placementChapterId,
        String placementChapterTitle,
        String name,
        String description,
        Integer durationMinutes,
        Integer passScorePercent,
        Integer maxAttempts,
        Boolean shuffleQuestions,
        Boolean shuffleOptions,
        Boolean showAnswerAfterSubmit,
        Integer questionCount,
        Double totalPoints,
        List<StudentExamQuestionResponse> questions,
        Instant updatedAt
) {
    public record StudentExamQuestionResponse(
            String id,
            String text,
            String type,
            List<String> options,
            JsonNode metadata,
            Double points,
            String difficulty
    ) {}

    private record StoredExamQuestion(
            String id,
            String text,
            String type,
            List<String> options,
            List<Integer> correctIndices,
            JsonNode metadata,
            String explanation,
            Double points,
            String difficulty
    ) {}

    public static StudentExamResponse fromEntity(ExamConfig config, ObjectMapper mapper) {
        List<StudentExamQuestionResponse> questions = parseQuestions(config.getQuestionsJson(), mapper);
        double totalPoints = questions.stream()
                .map(StudentExamQuestionResponse::points)
                .filter(point -> point != null)
                .mapToDouble(Double::doubleValue)
                .sum();
        return new StudentExamResponse(
                config.getId(),
                config.getCourse().getId(),
                config.getSlotIndex(),
                config.getScopeStartChapter() != null ? config.getScopeStartChapter().getId() : null,
                config.getScopeStartChapter() != null ? config.getScopeStartChapter().getTitle() : null,
                config.getPlacementChapter() != null ? config.getPlacementChapter().getId() : null,
                config.getPlacementChapter() != null ? config.getPlacementChapter().getTitle() : null,
                config.getName(),
                config.getDescription(),
                config.getDurationMinutes(),
                config.getPassScorePercent(),
                config.getMaxAttempts(),
                config.getShuffleQuestions(),
                config.getShuffleOptions(),
                config.getShowAnswerAfterSubmit(),
                questions.size(),
                totalPoints,
                questions,
                config.getUpdatedAt()
        );
    }

    private static List<StudentExamQuestionResponse> parseQuestions(String json, ObjectMapper mapper) {
        try {
            List<StoredExamQuestion> questions = readQuestions(json, mapper);
            return questions.stream()
                    .map(question -> new StudentExamQuestionResponse(
                            question.id(),
                            question.text(),
                            question.type(),
                            question.options() != null ? question.options() : List.of(),
                            question.metadata(),
                            question.points(),
                            question.difficulty()
                    ))
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    private static List<StoredExamQuestion> readQuestions(String json, ObjectMapper mapper) throws Exception {
        try {
            return mapper.readValue(json, new TypeReference<List<StoredExamQuestion>>() {});
        } catch (Exception first) {
            String unwrapped = mapper.readValue(json, String.class);
            return mapper.readValue(unwrapped, new TypeReference<List<StoredExamQuestion>>() {});
        }
    }
}
