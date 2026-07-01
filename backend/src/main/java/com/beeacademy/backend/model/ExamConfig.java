package com.beeacademy.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "exam_configs",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_exam_configs_course_slot",
                columnNames = {"course_id", "slot_index"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExamConfig {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Profile teacher;

    @Column(name = "slot_index", nullable = false)
    private Integer slotIndex;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false, length = 20)
    private ExamType examType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anchor_chapter_id")
    private Chapter anchorChapter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "start_chapter_id")
    private Chapter startChapter;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "pass_score_percent", nullable = false)
    private Integer passScorePercent;

    @Column(name = "multiple_choice_score", nullable = false)
    private Double multipleChoiceScore;

    @Column(name = "essay_score", nullable = false)
    private Double essayScore;

    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts;

    @Column(name = "shuffle_questions", nullable = false)
    private Boolean shuffleQuestions;

    @Column(name = "shuffle_options", nullable = false)
    private Boolean shuffleOptions;

    @Column(name = "show_answer_after_submit", nullable = false)
    private Boolean showAnswerAfterSubmit;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "questions", nullable = false, columnDefinition = "jsonb")
    private String questionsJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static ExamConfig create(Course course, Profile teacher, Integer slotIndex,
                                    ExamType examType, Chapter startChapter, Chapter anchorChapter,
                                    String name, String description,
                                    Integer durationMinutes, Integer passScorePercent,
                                    Double multipleChoiceScore, Double essayScore,
                                    Integer maxAttempts, Boolean shuffleQuestions,
                                    Boolean shuffleOptions, Boolean showAnswerAfterSubmit,
                                    String questionsJson) {
        ExamConfig config = new ExamConfig();
        config.id = UUID.randomUUID();
        config.course = course;
        config.teacher = teacher;
        config.slotIndex = slotIndex;
        config.update(examType, startChapter, anchorChapter, name, description, durationMinutes, passScorePercent,
                multipleChoiceScore, essayScore, maxAttempts,
                shuffleQuestions, shuffleOptions, showAnswerAfterSubmit, questionsJson);
        return config;
    }

    public void update(ExamType examType, Chapter startChapter, Chapter anchorChapter,
                       String name, String description,
                       Integer durationMinutes, Integer passScorePercent,
                       Double multipleChoiceScore, Double essayScore,
                       Integer maxAttempts, Boolean shuffleQuestions,
                       Boolean shuffleOptions, Boolean showAnswerAfterSubmit,
                       String questionsJson) {
        this.examType = examType;
        this.startChapter = startChapter;
        this.anchorChapter = anchorChapter;
        this.name = name;
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.passScorePercent = passScorePercent;
        this.multipleChoiceScore = multipleChoiceScore;
        this.essayScore = essayScore;
        this.maxAttempts = maxAttempts;
        this.shuffleQuestions = shuffleQuestions;
        this.shuffleOptions = shuffleOptions;
        this.showAnswerAfterSubmit = showAnswerAfterSubmit;
        this.questionsJson = questionsJson;
    }
}
