package com.beeacademy.backend.dto.response;

import com.beeacademy.backend.model.CourseDocument;
import com.beeacademy.backend.model.Lesson;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

/** Thông tin bài giảng phía GV — kèm đường dẫn storage để biết video đã upload chưa. */
public record TeacherLessonResponse(
        UUID id,
        String title,
        String description,
        Integer position,
        Boolean isFree,
        String videoEmbedUrl,
        String videoStoragePath,   // null = chưa upload video
        String videoUrl,           // URL public (cũ) hoặc null
        Integer durationSec,
        boolean hasVideo,          // convenience flag cho FE
        List<DocumentDto> documents
) {
    public record DocumentDto(UUID id, String name, String fileType, Integer position) {
        public static DocumentDto fromEntity(CourseDocument document) {
            return new DocumentDto(
                    document.getId(), document.getName(), document.getFileType(),
                    document.getPosition());
        }
    }

    public static TeacherLessonResponse fromEntity(Lesson l) {
        return fromEntity(l, Collections.emptyList());
    }

    public static TeacherLessonResponse fromEntity(Lesson l, List<CourseDocument> documents) {
        boolean hasVideo = l.getVideoStoragePath() != null || l.getVideoUrl() != null
                           || l.getVideoEmbedUrl() != null;
        List<DocumentDto> documentDtos = documents == null
                ? Collections.emptyList()
                : documents.stream().map(DocumentDto::fromEntity).toList();
        return new TeacherLessonResponse(
                l.getId(), l.getTitle(), l.getDescription(),
                l.getPosition(), l.getIsFree(),
                l.getVideoEmbedUrl(), l.getVideoStoragePath(), l.getVideoUrl(),
                l.getDurationSec(), hasVideo, documentDtos
        );
    }
}
