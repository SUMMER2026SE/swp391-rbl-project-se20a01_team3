package com.beeacademy.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "student_video_progress",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_student_video_progress_student_lesson",
                columnNames = {"student_id", "lesson_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudentVideoProgress {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false, updatable = false)
    private Profile student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false, updatable = false)
    private Lesson lesson;

    @Column(name = "position_sec", nullable = false)
    private Integer positionSec;

    @Column(name = "duration_sec", nullable = false)
    private Integer durationSec;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static StudentVideoProgress create(Profile student, Lesson lesson,
                                              int positionSec, int durationSec) {
        StudentVideoProgress progress = new StudentVideoProgress();
        progress.id = UUID.randomUUID();
        progress.student = student;
        progress.lesson = lesson;
        progress.update(positionSec, durationSec);
        return progress;
    }

    public void update(int positionSec, int durationSec) {
        if (positionSec < 0 || durationSec < 0) {
            throw new IllegalArgumentException("Video progress values cannot be negative");
        }
        this.durationSec = durationSec;
        this.positionSec = durationSec > 0 ? Math.min(positionSec, durationSec) : positionSec;
    }
}
