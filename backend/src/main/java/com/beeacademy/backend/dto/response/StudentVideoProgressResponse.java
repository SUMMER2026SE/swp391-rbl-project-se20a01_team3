package com.beeacademy.backend.dto.response;

import com.beeacademy.backend.model.StudentVideoProgress;

import java.time.Instant;
import java.util.UUID;

public record StudentVideoProgressResponse(
        UUID lessonId,
        int positionSec,
        int durationSec,
        Instant updatedAt
) {
    public static StudentVideoProgressResponse empty(UUID lessonId) {
        return new StudentVideoProgressResponse(lessonId, 0, 0, null);
    }

    public static StudentVideoProgressResponse fromEntity(StudentVideoProgress progress) {
        return new StudentVideoProgressResponse(
                progress.getLesson().getId(),
                progress.getPositionSec(),
                progress.getDurationSec(),
                progress.getUpdatedAt()
        );
    }
}
