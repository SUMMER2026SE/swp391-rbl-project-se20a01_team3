package com.beeacademy.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "question_versions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuestionVersion {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "version_no", nullable = false)
    private Integer versionNo;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata_json", columnDefinition = "jsonb")
    private String metadataJson;

    @Column(name = "difficulty", nullable = false)
    private String difficulty;

    @Column(name = "type", nullable = false)
    private String type;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "choices_json", nullable = false, columnDefinition = "jsonb")
    private String choicesJson;

    @Column(name = "change_reason")
    private String changeReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static QuestionVersion snapshot(Question question, int versionNo,
                                           String choicesJson, String changeReason) {
        QuestionVersion version = new QuestionVersion();
        version.id = UUID.randomUUID();
        version.question = question;
        version.teacherId = question.getTeacher().getId();
        version.versionNo = versionNo;
        version.content = question.getContent();
        version.explanation = question.getExplanation();
        version.metadataJson = question.getMetadataJson();
        version.difficulty = question.getDifficulty();
        version.type = question.getType();
        version.choicesJson = choicesJson;
        version.changeReason = changeReason == null || changeReason.isBlank()
                ? "Question updated after it was used in attempts."
                : changeReason.trim();
        return version;
    }
}
